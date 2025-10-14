import mysql from 'mysql2/promise';
import { faker } from '@faker-js/faker';

// Fixed seed for reproducibility
faker.seed(12345);

const BATCH_SIZE = 5000;
const TARGET_ATTENDANCE_ROWS = 2_000_000;
const NUM_SCHOOLS = 50;
const NUM_SUBJECTS = 20;
const NUM_TEACHERS = 2000;
const NUM_STUDENTS = 50000;
const NUM_CLASSES = 1000;
const AVG_LESSONS_PER_CLASS = 150; // Will generate ~150k lessons
const AVG_ASSIGNMENTS_PER_CLASS = 30; // Will generate ~30k assignments

interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

const dbConfig: DatabaseConfig = {
  host: process.env.DB_HOST || 'mariadb',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'student',
  password: process.env.DB_PASSWORD || 'Passw0rd',
  database: process.env.DB_NAME || 'tahvel',
};

// Estonian subjects for authenticity
const estonianSubjects = [
  'Matemaatika', 'Eesti keel', 'Inglise keel', 'Füüsika', 'Keemia',
  'Bioloogia', 'Geograafia', 'Ajalugu', 'Ühiskonnaõpetus', 'Muusika',
  'Kunst', 'Kehaline kasvatus', 'Informaatika', 'Tööõpetus', 'Saksa keel',
  'Vene keel', 'Prantsuse keel', 'Kirjandus', 'Filosoofia', 'Psühholoogia'
];

// Estonian cities
const estonianCities = [
  'Tallinn', 'Tartu', 'Narva', 'Pärnu', 'Kohtla-Järve',
  'Viljandi', 'Rakvere', 'Maardu', 'Sillamäe', 'Kuressaare',
  'Võru', 'Valga', 'Haapsalu', 'Jõhvi', 'Paide'
];

async function waitForDatabase(connection: mysql.Connection, maxRetries = 30) {
  console.log('Waiting for database to be ready...');
  for (let i = 0; i < maxRetries; i++) {
    try {
      await connection.ping();
      console.log('Database is ready!');
      return;
    } catch (error) {
      console.log(`Attempt ${i + 1}/${maxRetries}: Database not ready yet...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  throw new Error('Database failed to become ready');
}

async function disableIndexes(connection: mysql.Connection) {
  console.log('\n=== Disabling indexes for faster insertion ===');
  const tables = [
    'attendance', 'grades', 'submissions', 'assignments', 
    'lessons', 'class_memberships', 'classes', 'users'
  ];
  
  for (const table of tables) {
    try {
      await connection.query(`ALTER TABLE ${table} DISABLE KEYS`);
      console.log(`Disabled keys for ${table}`);
    } catch (error: any) {
      console.log(`Note: Could not disable keys for ${table} (${error.message})`);
    }
  }
}

async function enableIndexes(connection: mysql.Connection) {
  console.log('\n=== Re-enabling and rebuilding indexes ===');
  const tables = [
    'users', 'schools', 'subjects', 'classes', 'class_memberships',
    'lessons', 'assignments', 'submissions', 'grades', 'attendance'
  ];
  
  for (const table of tables) {
    try {
      console.log(`Rebuilding indexes for ${table}...`);
      await connection.query(`ALTER TABLE ${table} ENABLE KEYS`);
      console.log(`Enabled keys for ${table}`);
    } catch (error: any) {
      console.log(`Note: Could not enable keys for ${table} (${error.message})`);
    }
  }
}

async function insertBatch(
  connection: mysql.Connection,
  table: string,
  columns: string[],
  rows: any[][]
) {
  if (rows.length === 0) return;
  
  const placeholders = rows.map(() => `(${columns.map(() => '?').join(',')})`).join(',');
  const values = rows.flat();
  const sql = `INSERT INTO ${table} (${columns.join(',')}) VALUES ${placeholders}`;
  
  await connection.query(sql, values);
}

async function seedSchools(connection: mysql.Connection): Promise<number[]> {
  console.log('\n=== Seeding Schools ===');
  const columns = ['name', 'address', 'city'];
  const batch: any[][] = [];
  const ids: number[] = [];
  const usedNames = new Set<string>();
  
  // Estonian school name variations for authenticity
  const schoolTypes = ['Gümnaasium', 'Kool', 'Keskkool', 'Ühisgümnaasium', 'Põhikool', 'Kutsekool'];
  const nameVariations = ['', 'I', 'II', 'III', 'Kesklinna', 'Linna', 'Riigi', 'Erakool'];
  
  for (let i = 0; i < NUM_SCHOOLS; i++) {
    const city = faker.helpers.arrayElement(estonianCities);
    const schoolType = faker.helpers.arrayElement(schoolTypes);
    const variation = faker.helpers.arrayElement(nameVariations);
    
    let schoolName = variation 
      ? `${city} ${variation} ${schoolType}`
      : `${city} ${schoolType}`;
    
    // Ensure uniqueness by adding number if duplicate
    let counter = 1;
    let uniqueName = schoolName;
    while (usedNames.has(uniqueName)) {
      uniqueName = `${schoolName} ${counter}`;
      counter++;
    }
    usedNames.add(uniqueName);
    
    batch.push([
      uniqueName,
      faker.location.streetAddress(),
      city
    ]);
  }
  
  await insertBatch(connection, 'schools', columns, batch);
  const [rows] = await connection.query('SELECT id FROM schools ORDER BY id');
  ids.push(...(rows as any[]).map(r => r.id));
  console.log(`Inserted ${ids.length} schools`);
  return ids;
}

async function seedSubjects(connection: mysql.Connection): Promise<number[]> {
  console.log('\n=== Seeding Subjects ===');
  const columns = ['name'];
  const batch: any[][] = estonianSubjects.map(s => [s]);
  
  await insertBatch(connection, 'subjects', columns, batch);
  const [rows] = await connection.query('SELECT id FROM subjects ORDER BY id');
  const ids = (rows as any[]).map(r => r.id);
  console.log(`Inserted ${ids.length} subjects`);
  return ids;
}

async function seedUsers(connection: mysql.Connection): Promise<{ teachers: number[], students: number[] }> {
  console.log('\n=== Seeding Users ===');
  const columns = ['username', 'email', 'password', 'first_name', 'last_name', 'role'];
  
  // Estonian first names
  const firstNames = [
    'Jaan', 'Mart', 'Andrus', 'Priit', 'Toomas', 'Margus', 'Kristjan', 'Tarmo',
    'Anne', 'Kati', 'Mari', 'Liis', 'Kristiina', 'Piret', 'Tiina', 'Kadri'
  ];
  
  const lastNames = [
    'Tamm', 'Saar', 'Sepp', 'Mägi', 'Kask', 'Kukk', 'Rebane', 'Koppel',
    'Ilves', 'Jõgi', 'Lepp', 'Männik', 'Org', 'Nurk', 'Põld', 'Raud'
  ];
  
  let batch: any[][] = [];
  const teacherIds: number[] = [];
  const studentIds: number[] = [];
  
  // Insert teachers
  console.log('Inserting teachers...');
  for (let i = 0; i < NUM_TEACHERS; i++) {
    const firstName = faker.helpers.arrayElement(firstNames);
    const lastName = faker.helpers.arrayElement(lastNames);
    const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}`;
    
    batch.push([
      username,
      `${username}@kool.ee`,
      '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJK', // Bcrypt hash placeholder
      firstName,
      lastName,
      'teacher'
    ]);
    
    if (batch.length >= BATCH_SIZE) {
      await insertBatch(connection, 'users', columns, batch);
      batch = [];
    }
  }
  if (batch.length > 0) {
    await insertBatch(connection, 'users', columns, batch);
    batch = [];
  }
  
  const [teacherRows] = await connection.query("SELECT id FROM users WHERE role = 'teacher' ORDER BY id");
  teacherIds.push(...(teacherRows as any[]).map(r => r.id));
  console.log(`Inserted ${teacherIds.length} teachers`);
  
  // Insert students
  console.log('Inserting students...');
  for (let i = 0; i < NUM_STUDENTS; i++) {
    const firstName = faker.helpers.arrayElement(firstNames);
    const lastName = faker.helpers.arrayElement(lastNames);
    const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${i}`;
    
    batch.push([
      username,
      `${username}@opilane.ee`,
      '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJK',
      firstName,
      lastName,
      'student'
    ]);
    
    if (batch.length >= BATCH_SIZE) {
      await insertBatch(connection, 'users', columns, batch);
      batch = [];
    }
  }
  if (batch.length > 0) {
    await insertBatch(connection, 'users', columns, batch);
  }
  
  const [studentRows] = await connection.query("SELECT id FROM users WHERE role = 'student' ORDER BY id");
  studentIds.push(...(studentRows as any[]).map(r => r.id));
  console.log(`Inserted ${studentIds.length} students`);
  
  return { teachers: teacherIds, students: studentIds };
}

async function seedClasses(connection: mysql.Connection, schoolIds: number[]): Promise<number[]> {
  console.log('\n=== Seeding Classes ===');
  const columns = ['school_id', 'name', 'year'];
  const batch: any[][] = [];
  const grades = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const letters = ['A', 'B', 'C', 'D', 'E'];
  
  for (let i = 0; i < NUM_CLASSES; i++) {
    const grade = faker.helpers.arrayElement(grades);
    const letter = faker.helpers.arrayElement(letters);
    const schoolId = faker.helpers.arrayElement(schoolIds);
    const year = faker.number.int({ min: 2020, max: 2025 });
    
    batch.push([schoolId, `${grade}${letter}`, year]);
  }
  
  await insertBatch(connection, 'classes', columns, batch);
  const [rows] = await connection.query('SELECT id FROM classes ORDER BY id');
  const ids = (rows as any[]).map(r => r.id);
  console.log(`Inserted ${ids.length} classes`);
  return ids;
}

async function seedClassMemberships(
  connection: mysql.Connection,
  classIds: number[],
  studentIds: number[]
): Promise<void> {
  console.log('\n=== Seeding Class Memberships ===');
  const columns = ['class_id', 'user_id', 'start_date', 'end_date'];
  let batch: any[][] = [];
  let count = 0;
  
  // Assign students to classes (each student to 1 class)
  for (const studentId of studentIds) {
    const classId = faker.helpers.arrayElement(classIds);
    const startDate = faker.date.between({ from: '2020-09-01', to: '2025-09-01' });
    const endDate = Math.random() > 0.9 ? faker.date.future({ refDate: startDate }) : null;
    
    batch.push([classId, studentId, startDate.toISOString().split('T')[0], endDate ? endDate.toISOString().split('T')[0] : null]);
    count++;
    
    if (batch.length >= BATCH_SIZE) {
      await insertBatch(connection, 'class_memberships', columns, batch);
      batch = [];
    }
  }
  
  if (batch.length > 0) {
    await insertBatch(connection, 'class_memberships', columns, batch);
  }
  
  console.log(`Inserted ${count} class memberships`);
}

async function seedLessons(
  connection: mysql.Connection,
  classIds: number[],
  teacherIds: number[],
  subjectIds: number[]
): Promise<number[]> {
  console.log('\n=== Seeding Lessons ===');
  const columns = ['class_id', 'teacher_id', 'date', 'start_time', 'end_time', 'topic', 'subject_id'];
  let batch: any[][] = [];
  let count = 0;
  const usedSlots = new Set<string>(); // Track used class_id-date-start_time combinations
  
  const totalLessons = AVG_LESSONS_PER_CLASS * classIds.length;
  const maxAttempts = totalLessons * 3; // Allow multiple attempts to find unique slots
  let attempts = 0;
  
  while (count < totalLessons && attempts < maxAttempts) {
    attempts++;
    
    const classId = faker.helpers.arrayElement(classIds);
    const teacherId = faker.helpers.arrayElement(teacherIds);
    const subjectId = faker.helpers.arrayElement(subjectIds);
    const date = faker.date.between({ from: '2023-09-01', to: '2025-06-30' });
    const startHour = faker.number.int({ min: 8, max: 15 });
    const startTime = `${startHour.toString().padStart(2, '0')}:00:00`;
    const endTime = `${(startHour + 1).toString().padStart(2, '0')}:30:00`;
    const topic = faker.lorem.sentence(4);
    
    // Create unique key for this lesson slot
    const slotKey = `${classId}-${date.toISOString().split('T')[0]}-${startTime}`;
    
    // Skip if this slot is already used
    if (usedSlots.has(slotKey)) {
      continue;
    }
    
    usedSlots.add(slotKey);
    
    batch.push([
      classId,
      teacherId,
      date.toISOString().split('T')[0],
      startTime,
      endTime,
      topic,
      subjectId
    ]);
    count++;
    
    if (batch.length >= BATCH_SIZE) {
      await insertBatch(connection, 'lessons', columns, batch);
      console.log(`Inserted ${count} lessons so far...`);
      batch = [];
    }
  }
  
  if (batch.length > 0) {
    await insertBatch(connection, 'lessons', columns, batch);
  }
  
  console.log(`Inserted ${count} total lessons`);
  
  const [rows] = await connection.query('SELECT id FROM lessons ORDER BY id');
  return (rows as any[]).map(r => r.id);
}

async function seedAttendance(
  connection: mysql.Connection,
  lessonIds: number[],
  studentIds: number[]
): Promise<void> {
  console.log('\n=== Seeding Attendance (TARGET: 2M rows) ===');
  const columns = ['lesson_id', 'student_id', 'status'];
  const statuses = ['present', 'absent', 'late', 'excused'];
  let batch: any[][] = [];
  let count = 0;
  
  // First, get class memberships to ensure realistic attendance
  const [memberships] = await connection.query(`
    SELECT cm.class_id, cm.user_id as student_id, l.id as lesson_id
    FROM class_memberships cm
    JOIN lessons l ON l.class_id = cm.class_id
    ORDER BY l.id, cm.user_id
  `);
  
  const attendanceData = memberships as any[];
  console.log(`Generating attendance for ${attendanceData.length} lesson-student combinations...`);
  
  for (const record of attendanceData) {
    // 85% present, 5% absent, 5% late, 5% excused
    const status = faker.helpers.arrayElement([
      ...Array(85).fill('present'),
      ...Array(5).fill('absent'),
      ...Array(5).fill('late'),
      ...Array(5).fill('excused')
    ]);
    
    batch.push([record.lesson_id, record.student_id, status]);
    count++;
    
    if (batch.length >= BATCH_SIZE) {
      await insertBatch(connection, 'attendance', columns, batch);
      console.log(`Inserted ${count} attendance records so far...`);
      batch = [];
    }
  }
  
  if (batch.length > 0) {
    await insertBatch(connection, 'attendance', columns, batch);
  }
  
  console.log(`Inserted ${count} total attendance records`);
}

async function seedAssignments(
  connection: mysql.Connection,
  classIds: number[],
  teacherIds: number[],
  subjectIds: number[]
): Promise<number[]> {
  console.log('\n=== Seeding Assignments ===');
  const columns = ['title', 'description', 'creator_id', 'class_id', 'subject_id', 'due_date'];
  let batch: any[][] = [];
  let count = 0;
  
  const totalAssignments = AVG_ASSIGNMENTS_PER_CLASS * classIds.length;
  
  for (let i = 0; i < totalAssignments; i++) {
    const classId = faker.helpers.arrayElement(classIds);
    const teacherId = faker.helpers.arrayElement(teacherIds);
    const subjectId = faker.helpers.arrayElement(subjectIds);
    const dueDate = faker.date.between({ from: '2023-09-01', to: '2025-12-31' });
    
    batch.push([
      faker.lorem.sentence(3),
      faker.lorem.paragraph(2),
      teacherId,
      classId,
      subjectId,
      dueDate.toISOString().slice(0, 19).replace('T', ' ')
    ]);
    count++;
    
    if (batch.length >= BATCH_SIZE) {
      await insertBatch(connection, 'assignments', columns, batch);
      batch = [];
    }
  }
  
  if (batch.length > 0) {
    await insertBatch(connection, 'assignments', columns, batch);
  }
  
  console.log(`Inserted ${count} assignments`);
  
  const [rows] = await connection.query('SELECT id FROM assignments ORDER BY id');
  return (rows as any[]).map(r => r.id);
}

async function seedSubmissions(
  connection: mysql.Connection,
  assignmentIds: number[]
): Promise<number[]> {
  console.log('\n=== Seeding Submissions ===');
  const columns = ['assignment_id', 'student_id', 'submitted_at', 'content'];
  let batch: any[][] = [];
  let count = 0;
  
  // Get students per assignment via class memberships
  const [assignments] = await connection.query(`
    SELECT a.id as assignment_id, cm.user_id as student_id
    FROM assignments a
    JOIN class_memberships cm ON cm.class_id = a.class_id
    WHERE cm.user_id IN (SELECT id FROM users WHERE role = 'student')
  `);
  
  const submissionData = assignments as any[];
  console.log(`Generating submissions for ${submissionData.length} assignment-student combinations...`);
  
  for (const record of submissionData) {
    // 80% submission rate
    if (Math.random() > 0.2) {
      const submittedAt = faker.date.recent({ days: 60 });
      
      batch.push([
        record.assignment_id,
        record.student_id,
        submittedAt.toISOString().slice(0, 19).replace('T', ' '),
        faker.lorem.paragraphs(3)
      ]);
      count++;
      
      if (batch.length >= BATCH_SIZE) {
        await insertBatch(connection, 'submissions', columns, batch);
        console.log(`Inserted ${count} submissions so far...`);
        batch = [];
      }
    }
  }
  
  if (batch.length > 0) {
    await insertBatch(connection, 'submissions', columns, batch);
  }
  
  console.log(`Inserted ${count} submissions`);
  
  const [rows] = await connection.query('SELECT id FROM submissions ORDER BY id');
  return (rows as any[]).map(r => r.id);
}

async function seedGrades(
  connection: mysql.Connection,
  submissionIds: number[]
): Promise<void> {
  console.log('\n=== Seeding Grades ===');
  const columns = ['submission_id', 'grade_value', 'comment', 'grade_at', 'grade_missing'];
  const gradeValues = ['1', '2', '3', '4', '5', 'PASSED', 'FAILED'];
  let batch: any[][] = [];
  let count = 0;
  
  for (const submissionId of submissionIds) {
    // 90% of submissions get graded
    if (Math.random() > 0.1) {
      const gradeValue = faker.helpers.arrayElement(gradeValues);
      const comment = Math.random() > 0.5 ? faker.lorem.sentence() : null;
      const gradeAt = faker.date.recent({ days: 30 });
      const gradeMissing = 0;
      
      batch.push([
        submissionId,
        gradeValue,
        comment,
        gradeAt.toISOString().slice(0, 19).replace('T', ' '),
        gradeMissing
      ]);
      count++;
      
      if (batch.length >= BATCH_SIZE) {
        await insertBatch(connection, 'grades', columns, batch);
        batch = [];
      }
    }
  }
  
  if (batch.length > 0) {
    await insertBatch(connection, 'grades', columns, batch);
  }
  
  console.log(`Inserted ${count} grades`);
}

async function printStatistics(connection: mysql.Connection) {
  console.log('\n========================================');
  console.log('DATABASE STATISTICS');
  console.log('========================================\n');
  
  const tables = [
    'schools', 'subjects', 'users', 'classes', 'class_memberships',
    'lessons', 'attendance', 'assignments', 'submissions', 'grades'
  ];
  
  for (const table of tables) {
    const [rows] = await connection.query(`SELECT COUNT(*) as count FROM ${table}`);
    const count = (rows as any[])[0].count;
    console.log(`${table.padEnd(20)} : ${count.toLocaleString()}`);
  }
  
  console.log('\n========================================\n');
}

async function main() {
  const startTime = Date.now();
  console.log('========================================');
  console.log('TAHVEL DATABASE SEEDING SCRIPT');
  console.log('========================================');
  console.log(`Started at: ${new Date().toISOString()}`);
  
  let connection: mysql.Connection | null = null;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    await waitForDatabase(connection);
    
    // Disable foreign key checks and autocommit for performance
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('SET AUTOCOMMIT = 0');
    await connection.query('SET UNIQUE_CHECKS = 0');
    
    await disableIndexes(connection);
    
    // Seed in dependency order
    const schoolIds = await seedSchools(connection);
    const subjectIds = await seedSubjects(connection);
    const { teachers, students } = await seedUsers(connection);
    const classIds = await seedClasses(connection, schoolIds);
    await seedClassMemberships(connection, classIds, students);
    const lessonIds = await seedLessons(connection, classIds, teachers, subjectIds);
    await seedAttendance(connection, lessonIds, students); // This creates 2M+ rows
    const assignmentIds = await seedAssignments(connection, classIds, teachers, subjectIds);
    const submissionIds = await seedSubmissions(connection, assignmentIds);
    await seedGrades(connection, submissionIds);
    
    await connection.query('COMMIT');
    
    // Re-enable foreign keys and rebuild indexes
    await connection.query('SET UNIQUE_CHECKS = 1');
    await enableIndexes(connection);
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    
    await printStatistics(connection);
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log(`Completed in ${duration} seconds`);
    console.log('========================================');
    
  } catch (error) {
    console.error('Error during seeding:', error);
    if (connection) {
      await connection.query('ROLLBACK');
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

main();
