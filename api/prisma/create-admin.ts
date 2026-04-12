import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, (answer) => resolve(answer.trim()));
  });
};

async function createAdmin() {
  console.log('--- Criar Usuário Administrador ---\n');

  try {
    // 1. Receber dados por argumento (cli) ou via prompt iterativo
    let name = process.argv[2];
    let email = process.argv[3];
    let password = process.argv[4];

    if (!name || !email || !password) {
      console.log('Utilizando modo interativo porque não foram fornecidos todos argumentos via CLI.');
      console.log('Uso via CLI: npm run create:admin "Nome" "email@admin.com" "senha123"\n');

      name = await question('Digite o NOME do administrador: ');
      email = await question('Digite o E-MAIL do administrador: ');
      password = await question('Digite a SENHA do administrador: ');
    }

    if (!name || !email || !password) {
      console.error('\nErro: Todos os campos (nome, email, senha) são obrigatórios.');
      process.exit(1);
    }

    // 2. Verificar se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Promover usuário existente se já existir, mas não explodir
      if (existingUser.role !== Role.ADMIN) {
        console.log(`\nO usuário com e-mail ${email} já existe como cliente. Promovendo a Administrador...`);
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { role: Role.ADMIN },
        });
        console.log('Usuário promovido a ADMIN com sucesso!');
      } else {
        console.log(`\nO e-mail ${email} já está cadastrado e já é um ADMIN.`);
      }
      process.exit(0);
    }

    // 3. Fazer hash da senha e criar
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const admin = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: Role.ADMIN,
      },
    });

    console.log('\nAdministrador criado com sucesso!');
    console.log(`- ID: ${admin.id}`);
    console.log(`- Nome: ${admin.name}`);
    console.log(`- Email: ${admin.email}`);
    console.log('- Papel: ADMIN');

  } catch (error) {
    console.error('\nOcorreu um erro ao criar o administrador:', error);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

createAdmin();
