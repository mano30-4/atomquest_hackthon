#!/usr/bin/env node

const {
  sequelize,
  User,
  ThrustArea,
  GoalSheet,
  Goal,
  Checkin,
  CheckinComment,
  AuditLog
} = require('../src/models');
const config = require('../src/config');

const runtimeTables = [
  'users',
  'thrust_areas',
  'goal_sheets',
  'goals',
  'checkins',
  'checkin_comments',
  'audit_logs'
];

async function getExistingRuntimeTables() {
  const [rows] = await sequelize.query(
    `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN (:tables)
    `,
    { replacements: { tables: runtimeTables } }
  );

  return new Set(rows.map((row) => row.table_name));
}

async function ensureSchema() {
  const existingTables = await getExistingRuntimeTables();
  const missingTables = runtimeTables.filter((table) => !existingTables.has(table));

  const userCount = existingTables.has('users') ? await User.count() : 0;
  const seededEmployee = existingTables.has('users')
    ? await User.findOne({ where: { email: 'employee2@atomquest.com' } })
    : null;
  const staleSeedData = seededEmployee && seededEmployee.name !== 'Omar Johnson';

  if (missingTables.length > 0 || userCount < 8 || staleSeedData) {
    console.log(
      missingTables.length > 0
        ? `Creating runtime schema; missing tables: ${missingTables.join(', ')}`
        : 'Refreshing demo data to the coherent full dataset.'
    );
    await sequelize.query(`
      DROP TABLE IF EXISTS
        "AuditLogs",
        "CheckinComments",
        "Checkins",
        "Goals",
        "GoalSheets",
        "ThrustAreas",
        "Users",
        "audit_logs",
        "checkin_comments",
        "checkins",
        "goals",
        "goal_sheets",
        "thrust_areas",
        "users"
      CASCADE;
    `);
    await sequelize.sync({ force: true });
    return;
  }

  console.log('Runtime schema already exists.');
}

async function seedThrustAreas() {
  const count = await ThrustArea.count();
  if (count > 0) return;

  await ThrustArea.bulkCreate([
    {
      name: 'Revenue Growth',
      description: 'Goals that improve sales, retention, and revenue expansion.'
    },
    {
      name: 'Customer Experience',
      description: 'Goals that improve customer satisfaction and service quality.'
    },
    {
      name: 'Operational Excellence',
      description: 'Goals that improve quality, efficiency, and delivery reliability.'
    },
    {
      name: 'Innovation',
      description: 'Goals that create new products, processes, or ways of working.'
    },
    {
      name: 'People Development',
      description: 'Goals that strengthen capability, coaching, and team growth.'
    },
    {
      name: 'Risk & Compliance',
      description: 'Goals that reduce operational, compliance, and security risk.'
    }
  ]);
}

async function seedUsersAndGoals() {
  const userCount = await User.count();
  if (userCount > 0) return;

  const users = {};
  for (const user of [
    ['admin', 'admin@atomquest.com', 'Admin User', 'admin', 'People Operations', null],
    ['m1', 'manager1@atomquest.com', 'Mira Kapoor', 'manager', 'Sales', null],
    ['m2', 'manager2@atomquest.com', 'Rahul Mehta', 'manager', 'Engineering', null]
  ]) {
    users[user[0]] = await User.create({
      email: user[1],
      passwordHash: 'Password123!',
      name: user[2],
      role: user[3],
      department: user[4],
      managerId: user[5]
    });
  }

  for (const user of [
    ['e1', 'employee1@atomquest.com', 'Alice Smith', 'employee', 'Sales', users.m1.id],
    ['e2', 'employee2@atomquest.com', 'Omar Johnson', 'employee', 'Customer Success', users.m1.id],
    ['e3', 'employee3@atomquest.com', 'Chris Lee', 'employee', 'Sales', users.m1.id],
    ['e4', 'employee4@atomquest.com', 'Diana Wilson', 'employee', 'Engineering', users.m2.id],
    ['e5', 'employee5@atomquest.com', 'Ethan Brown', 'employee', 'Engineering', users.m2.id],
    ['e6', 'employee6@atomquest.com', 'Fatima Khan', 'employee', 'Quality', users.m2.id]
  ]) {
    users[user[0]] = await User.create({
      email: user[1],
      passwordHash: 'Password123!',
      name: user[2],
      role: user[3],
      department: user[4],
      managerId: user[5]
    });
  }

  const sheetDefinitions = [
    { user: users.e1, status: 'approved', manager: users.m1, approved: true },
    { user: users.e2, status: 'submitted', manager: users.m1 },
    { user: users.e3, status: 'returned', manager: users.m1, feedback: 'Make targets more measurable and balance weightage.' },
    { user: users.e4, status: 'approved', manager: users.m2, approved: true },
    { user: users.e5, status: 'draft', manager: users.m2 },
    { user: users.e6, status: 'approved', manager: users.m2, approved: true }
  ];

  const goalTemplates = [
    ['Revenue Growth', 'Grow qualified pipeline', 'Increase qualified opportunities in the owned segment.', 'numeric_min', '50', 30],
    ['Customer Experience', 'Improve customer satisfaction', 'Raise customer satisfaction for assigned accounts.', 'percentage_min', '90', 25],
    ['Operational Excellence', 'Reduce turnaround time', 'Lower average response turnaround time in hours.', 'numeric_max', '4', 25],
    ['People Development', 'Complete mentoring plan', 'Finish mentoring and capability plan by the checkpoint.', 'timeline', '2026-10-31', 20]
  ];

  const progressByUser = {
    e1: [42, 88, 5, '2026-10-20'],
    e4: [36, 84, 4, '2026-11-02'],
    e6: [48, 93, 3, '2026-10-15']
  };

  for (const definition of sheetDefinitions) {
    const goalSheet = await GoalSheet.create({
      userId: definition.user.id,
      fiscalYear: config.app.fiscalYear,
      status: definition.status,
      approvedBy: definition.approved ? definition.manager.id : null,
      approvedAt: definition.approved ? new Date('2026-06-10T09:00:00Z') : null,
      returnedBy: definition.feedback ? definition.manager.id : null,
      returnedAt: definition.feedback ? new Date('2026-06-12T09:00:00Z') : null,
      managerFeedback: definition.feedback || null,
      managerComments: definition.approved ? 'Approved for FY execution.' : null
    });

    const goals = await Goal.bulkCreate(goalTemplates.map((template, index) => ({
      goalSheetId: goalSheet.id,
      thrustArea: template[0],
      title: `${template[1]} - ${definition.user.name.split(' ')[0]}`,
      description: template[2],
      uom: template[3],
      target: template[4],
      weightage: template[5],
      status: definition.approved ? (index === 1 ? 'completed' : 'on_track') : 'not_started',
      isLocked: definition.approved
    })));

    const userKey = Object.entries(users).find(([, value]) => value.id === definition.user.id)?.[0];
    if (definition.approved && progressByUser[userKey]) {
      for (const [index, goal] of goals.entries()) {
        const achievement = progressByUser[userKey][index];
        const progress = Math.min(index === 2 ? (Number(goal.target) / Number(achievement)) * 100 : (Number(achievement) / Number(goal.target)) * 100, 100);
        await Checkin.create({
          goalId: goal.id,
          quarter: 'Q1',
          plannedTarget: goal.target,
          actualAchievement: String(achievement),
          progress: goal.uom === 'timeline' ? (new Date(achievement) <= new Date(goal.target) ? 100 : 90) : progress.toFixed(2),
          status: index === 1 ? 'completed' : 'on_track'
        });
      }
    }
  }

  await CheckinComment.bulkCreate([
    {
      employeeId: users.e1.id,
      managerId: users.m1.id,
      quarter: 'Q1',
      comment: 'Good pipeline movement. Keep response time tight in Q2.'
    },
    {
      employeeId: users.e4.id,
      managerId: users.m2.id,
      quarter: 'Q1',
      comment: 'Strong operational progress. Customer score needs attention.'
    }
  ]);

  await AuditLog.bulkCreate([
    {
      action: 'DEMO_DATA_CREATED',
      entityType: 'system',
      entityId: 1,
      userId: users.admin.id,
      changes: { users: 9, goalSheets: 6, note: 'Coherent demo dataset loaded' },
      timestamp: new Date()
    },
    {
      action: 'GOALS_APPROVED',
      entityType: 'goal_sheet',
      entityId: 1,
      userId: users.m1.id,
      changes: { status: { from: 'submitted', to: 'approved' } },
      timestamp: new Date('2026-06-10T09:00:00Z')
    }
  ]);

  console.log(`Seeded coherent demo data. Admin id: ${users.admin.id}`);
}

async function bootstrapRuntimeDb({ close = true } = {}) {
  await sequelize.authenticate();
  await ensureSchema();
  await seedThrustAreas();
  await seedUsersAndGoals();
  if (close) await sequelize.close();

  console.log('Runtime database bootstrap complete.');
}

if (require.main === module) {
  bootstrapRuntimeDb().catch(async (error) => {
    console.error('Runtime database bootstrap failed:', error);
    await sequelize.close();
    process.exit(1);
  });
}

module.exports = { bootstrapRuntimeDb };
