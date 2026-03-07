import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create Account Manager
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@2coms.com' },
    update: { password: adminPassword },
    create: {
      email: 'admin@2coms.com',
      password: adminPassword,
      name: 'Sarah Mitchell',
      role: 'ACCOUNT_MANAGER',
    },
  })
  console.log('✅ Created admin:', admin.email)

  // Create Clients
  const acme = await prisma.client.upsert({
    where: { id: 'client-acme' },
    update: {},
    create: {
      id: 'client-acme',
      companyName: 'ACME Corporation',
      contacts: {
        create: [
          { contactName: 'John Smith', email: 'john@acme.com', role: 'HR Manager' },
          { contactName: 'Jane Doe', email: 'jane@acme.com', role: 'CTO' },
        ],
      },
    },
  })

  const techCorp = await prisma.client.upsert({
    where: { id: 'client-tech' },
    update: {},
    create: {
      id: 'client-tech',
      companyName: 'TechCorp Solutions',
      contacts: {
        create: [
          { contactName: 'Robert Chen', email: 'rchen@techcorp.com', role: 'Project Manager' },
        ],
      },
    },
  })

  console.log('✅ Created clients:', acme.companyName, techCorp.companyName)

  const clientPassword = await bcrypt.hash('client123', 12)
  await prisma.user.upsert({
    where: { email: 'client@acme.com' },
    update: { password: clientPassword },
    create: {
      email: 'client@acme.com',
      password: clientPassword,
      name: 'John Smith',
      role: 'CLIENT',
      clientId: acme.id,
    },
  })

  // Create Vendors
  const vendor1 = await prisma.vendor.upsert({
    where: { id: 'vendor-1' },
    update: {},
    create: {
      id: 'vendor-1',
      name: 'TechSkills Academy',
      email: 'training@techskills.com',
      phone: '+91-9876543210',
      trainingTypes: ['COMPUTER_SKILLS', 'LOGIC_SKILLS'],
    },
  })

  const vendor2 = await prisma.vendor.upsert({
    where: { id: 'vendor-2' },
    update: {},
    create: {
      id: 'vendor-2',
      name: 'BizPro Institute',
      email: 'hello@bizpro.com',
      phone: '+91-9876543211',
      trainingTypes: ['BUSINESS_SKILLS'],
    },
  })

  console.log('✅ Created vendors:', vendor1.name, vendor2.name)

  // Create Projects
  const project1 = await prisma.project.upsert({
    where: { id: 'project-1' },
    update: {},
    create: {
      id: 'project-1',
      clientId: acme.id,
      projectName: 'Digital Transformation 2025',
      projectType: 'ON_SITE',
      trainingRequired: true,
      description: 'Full-scale digital transformation initiative for ACME Corp',
    },
  })

  const project2 = await prisma.project.upsert({
    where: { id: 'project-2' },
    update: {},
    create: {
      id: 'project-2',
      clientId: techCorp.id,
      projectName: 'Cloud Migration Initiative',
      projectType: 'OFF_SITE',
      trainingRequired: false,
      description: 'Migrating legacy systems to cloud infrastructure',
    },
  })

  console.log('✅ Created projects:', project1.projectName, project2.projectName)

  // Create Trainings (ON_SITE project must have at least 2)
  await prisma.training.createMany({
    data: [
      {
        projectId: project1.id,
        vendorId: vendor1.id,
        trainingType: 'COMPUTER_SKILLS',
        paymentSource: 'ABC_CORP',
        certificationRequired: true,
        startDate: new Date('2025-04-01'),
        endDate: new Date('2025-04-30'),
      },
      {
        projectId: project1.id,
        vendorId: vendor2.id,
        trainingType: 'BUSINESS_SKILLS',
        paymentSource: 'CLIENT',
        certificationRequired: false,
        startDate: new Date('2025-05-01'),
        endDate: new Date('2025-05-15'),
      },
      {
        projectId: project1.id,
        vendorId: vendor1.id,
        trainingType: 'LOGIC_SKILLS',
        paymentSource: 'TRAINEE',
        certificationRequired: true,
        startDate: new Date('2025-06-01'),
        endDate: new Date('2025-06-20'),
      },
    ],
  })

  // Create Trainees
  const trainee1 = await prisma.trainee.create({
    data: {
      projectId: project1.id,
      name: 'Alice Johnson',
      email: 'alice@example.com',
      phone: '+91-9876543212',
      skills: ['JavaScript', 'Python', 'SQL'],
      trainingStatus: 'CERTIFIED',
      certificationStatus: true,
    },
  })

  const trainee2 = await prisma.trainee.create({
    data: {
      projectId: project1.id,
      name: 'Bob Williams',
      email: 'bob@example.com',
      skills: ['Java', 'Spring Boot'],
      trainingStatus: 'TRAINING',
      certificationStatus: false,
    },
  })

  const trainee3 = await prisma.trainee.create({
    data: {
      projectId: project2.id,
      name: 'Carol Davis',
      email: 'carol@example.com',
      skills: ['AWS', 'Terraform', 'Docker'],
      trainingStatus: 'INTERVIEWING',
      certificationStatus: true,
    },
  })

  console.log('✅ Created trainees')

  // Create Interviews
  await prisma.interview.create({
    data: {
      traineeId: trainee1.id,
      scheduledAt: new Date('2025-07-10T10:00:00'),
      status: 'SHORTLISTED',
      notes: 'Excellent communication skills. Technical test passed.',
    },
  })

  await prisma.interview.create({
    data: {
      traineeId: trainee3.id,
      scheduledAt: new Date('2025-07-15T14:00:00'),
      status: 'INTERVIEW',
      notes: 'First round - technical assessment',
    },
  })

  console.log('✅ Created interviews')
  console.log('\n🎉 Seeding complete!')
  console.log('\n📋 Login Credentials:')
  console.log('  Account Manager: admin@2coms.com / admin123')
  console.log('  Client:          client@acme.com / client123')
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })
