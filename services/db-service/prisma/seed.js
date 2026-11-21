const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'Demo@1234';

async function upsertUser(email, name, role) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name, role, passwordHash },
  });
}

async function main() {
  const admin = await upsertUser('admin@demo.com', 'Admin User', 'admin');
  const lead = await upsertUser('lead@demo.com', 'Test Lead', 'test_lead');
  const tester = await upsertUser('tester@demo.com', 'Tester One', 'tester');
  const readOnly = await upsertUser('readonly@demo.com', 'Read Only User', 'read_only');

  const existingProject = await prisma.project.findFirst({ where: { name: 'E-Commerce Platform' } });
  const project = existingProject || await prisma.project.create({
    data: {
      name: 'E-Commerce Platform',
      description: 'Sample project for demo purposes',
      version: '1.0.0',
      status: 'Active',
      createdById: admin.id,
      members: {
        create: [admin.id, lead.id, tester.id, readOnly.id].map((userId) => ({ userId })),
      },
    },
  });

  const existingCases = await prisma.testCase.count({ where: { projectId: project.id } });
  if (existingCases === 0) {
    const priorities = ['Low', 'Medium', 'High', 'Critical'];
    const types = ['Functional', 'Integration', 'Regression', 'Smoke', 'UI', 'API'];

    const testCases = [];
    for (let i = 1; i <= 15; i += 1) {
      const testCase = await prisma.testCase.create({
        data: {
          projectId: project.id,
          title: `Verify login flow scenario ${i}`,
          description: `Sample test case #${i} for seeded demo data`,
          priority: priorities[i % priorities.length],
          type: types[i % types.length],
          preconditions: 'User account exists',
          postconditions: 'User session is created',
          tags: ['demo', 'seed'],
          createdById: lead.id,
          steps: {
            create: [
              { stepNo: 1, action: 'Navigate to login page', expectedResult: 'Login form is visible' },
              { stepNo: 2, action: 'Enter valid credentials and submit', expectedResult: 'User is redirected to dashboard' },
            ],
          },
        },
      });
      testCases.push(testCase);
    }

    const suite = await prisma.testSuite.create({
      data: {
        projectId: project.id,
        name: 'Smoke Suite',
        description: 'Core smoke tests',
        cases: { create: testCases.slice(0, 5).map((tc) => ({ testCaseId: tc.id })) },
      },
    });

    const statuses = ['Pass', 'Fail', 'Blocked', 'Skipped'];
    for (let i = 0; i < testCases.length; i += 1) {
      await prisma.testExecution.create({
        data: {
          testCaseId: testCases[i].id,
          suiteId: i < 5 ? suite.id : null,
          status: statuses[i % statuses.length],
          comment: 'Seeded execution result',
          executedById: tester.id,
        },
      });
    }
  }

  console.log('Seed complete. Demo password for all users:', DEMO_PASSWORD);
  console.log('admin@demo.com / lead@demo.com / tester@demo.com / readonly@demo.com');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
