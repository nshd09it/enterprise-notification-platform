import { PrismaClient, NotificationChannel } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const templates = [
    {
      slug: 'welcome-email',
      name: 'Welcome Email',
      channel: NotificationChannel.EMAIL,
      subject: 'Welcome to Enterprise Notification Platform',
      body: 'Hi {{name}}, your workspace is ready to send reliable multi-channel notifications.',
    },
    {
      slug: 'otp-sms',
      name: 'Login OTP SMS',
      channel: NotificationChannel.SMS,
      subject: null,
      body: 'Your verification code is {{code}}. It expires in 5 minutes.',
    },
    {
      slug: 'incident-webhook',
      name: 'Incident Alert Webhook',
      channel: NotificationChannel.WEBHOOK,
      subject: 'Production Incident Alert',
      body: '{"event":"incident.triggered","severity":"high","service":"payments-api"}',
    },
  ];

  for (const tpl of templates) {
    await prisma.notificationTemplate.upsert({
      where: { slug: tpl.slug },
      update: tpl,
      create: tpl,
    });
  }

  console.log(`Seeded ${templates.length} notification templates.`);
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
