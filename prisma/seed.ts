import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 기본 관리자 생성 (송동주)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@easychem.co.kr' },
    update: {},
    create: {
      name: '송동주',
      email: 'admin@easychem.co.kr',
      isAdmin: true,
    },
  });

  console.log('Created admin user:', admin);

  // 계약 카테고리 생성
  const categories = [
    '임대계약',
    '유지보수',
    '서비스계약',
    '구매계약',
    '차량',
    '기타',
  ];

  for (const name of categories) {
    await prisma.contractCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log('Created contract categories:', categories);

  // 기본 시스템 설정
  const defaultSettings = [
    { key: 'smtp_host', value: 'mail4.amaranth10.com' },
    { key: 'smtp_port', value: '25' },
    { key: 'smtp_user', value: 'djsong@easychem.co.kr' },
    { key: 'smtp_pass', value: 'dj9537aa21!123' },
    { key: 'smtp_from', value: 'djsong@easychem.co.kr' },
    { key: 'mail_send_hour', value: '9' },
    { key: 'mail_send_minute', value: '0' },
  ];

  for (const setting of defaultSettings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }

  console.log('Created system settings');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
