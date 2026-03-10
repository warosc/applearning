import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  await prisma.answer.deleteMany();
  await prisma.formSubmission.deleteMany();
  await prisma.formTemplate.deleteMany();
  await prisma.examAttempt.deleteMany();
  await prisma.questionOption.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.create({
    data: {
      username: 'admin',
      passwordHash: await bcrypt.hash('admin123', 10),
      name: 'Administrador',
      role: 'admin',
    },
  });
  await prisma.user.create({
    data: {
      username: 'demo',
      passwordHash: await bcrypt.hash('demo123', 10),
      name: 'Estudiante Demo',
      role: 'estudiante',
    },
  });

  await prisma.question.deleteMany();
  await prisma.examSection.deleteMany();
  await prisma.exam.deleteMany();

  const exam = await prisma.exam.create({
    data: {
      title: 'Examen Demo - Simulador',
      description: 'Examen de demostración con todos los tipos de pregunta',
      totalScore: 100,
      durationMinutes: 60,
      isPublished: true,
    },
  });

  const questionsData = [
    {
      orderIndex: 0,
      type: 'single_choice',
      prompt: '¿Cuál es la capital de Francia?',
      score: 10,
      options: [
        { label: 'Madrid', value: 'madrid', isCorrect: false, orderIndex: 0 },
        { label: 'París', value: 'paris', isCorrect: true, orderIndex: 1 },
        { label: 'Londres', value: 'londres', isCorrect: false, orderIndex: 2 },
      ],
    },
    {
      orderIndex: 1,
      type: 'single_choice',
      prompt: '¿En qué año llegó el hombre a la Luna?',
      score: 10,
      options: [
        { label: '1965', value: '1965', isCorrect: false, orderIndex: 0 },
        { label: '1969', value: '1969', isCorrect: true, orderIndex: 1 },
        { label: '1972', value: '1972', isCorrect: false, orderIndex: 2 },
      ],
    },
    {
      orderIndex: 2,
      type: 'multiple_choice',
      prompt: 'Selecciona los números pares:',
      score: 10,
      options: [
        { label: '2', value: '2', isCorrect: true, orderIndex: 0 },
        { label: '3', value: '3', isCorrect: false, orderIndex: 1 },
        { label: '4', value: '4', isCorrect: true, orderIndex: 2 },
        { label: '5', value: '5', isCorrect: false, orderIndex: 3 },
      ],
    },
    {
      orderIndex: 3,
      type: 'multiple_choice',
      prompt: '¿Cuáles son lenguajes de programación?',
      score: 10,
      options: [
        { label: 'Python', value: 'python', isCorrect: true, orderIndex: 0 },
        { label: 'HTML', value: 'html', isCorrect: false, orderIndex: 1 },
        { label: 'JavaScript', value: 'javascript', isCorrect: true, orderIndex: 2 },
      ],
    },
    {
      orderIndex: 4,
      type: 'numeric',
      prompt: '¿Cuánto es 15 + 27?',
      score: 10,
      metadataJson: { expected: '42' },
      options: [],
    },
    {
      orderIndex: 5,
      type: 'numeric',
      prompt: '¿Cuál es la raíz cuadrada de 144?',
      score: 10,
      metadataJson: { expected: '12' },
      options: [],
    },
    {
      orderIndex: 6,
      type: 'algebraic',
      prompt: 'Simplifica: x + x (responde como 2x)',
      score: 10,
      metadataJson: { expected: '2x' },
      options: [],
    },
    {
      orderIndex: 7,
      type: 'algebraic',
      prompt: '¿Cuánto es 2³? (responde como número)',
      score: 10,
      metadataJson: { expected: '8' },
      options: [],
    },
    {
      orderIndex: 8,
      type: 'drag_drop',
      prompt: 'Ordena las fases de la Luna de izquierda a derecha:',
      score: 10,
      options: [
        { label: 'Luna nueva', value: 'nueva', isCorrect: true, orderIndex: 0 },
        { label: 'Cuarto creciente', value: 'creciente', isCorrect: true, orderIndex: 1 },
        { label: 'Luna llena', value: 'llena', isCorrect: true, orderIndex: 2 },
        { label: 'Cuarto menguante', value: 'menguante', isCorrect: true, orderIndex: 3 },
      ],
    },
    {
      orderIndex: 9,
      type: 'drag_drop',
      prompt: 'Ordena los planetas por distancia al Sol (del más cercano al más lejano):',
      score: 10,
      options: [
        { label: 'Mercurio', value: 'mercurio', isCorrect: true, orderIndex: 0 },
        { label: 'Venus', value: 'venus', isCorrect: true, orderIndex: 1 },
        { label: 'Tierra', value: 'tierra', isCorrect: true, orderIndex: 2 },
        { label: 'Marte', value: 'marte', isCorrect: true, orderIndex: 3 },
      ],
    },
  ];

  for (const q of questionsData) {
    await prisma.question.create({
      data: {
        examId: exam.id,
        orderIndex: q.orderIndex,
        type: q.type,
        prompt: q.prompt,
        score: q.score,
        metadataJson: q.metadataJson ?? undefined,
        ...(q.options.length > 0 && {
          options: {
            create: q.options.map((o) => ({
              label: o.label,
              value: o.value,
              isCorrect: o.isCorrect,
              orderIndex: o.orderIndex,
            })),
          },
        }),
      },
    });
  }

  await prisma.formTemplate.create({
    data: {
      examId: exam.id,
      title: 'Datos del estudiante',
      schemaJson: {
        fields: [
          { id: 'nombre', label: 'Nombre completo', type: 'text', required: true },
          { id: 'grado', label: 'Grado', type: 'text', required: false },
          { id: 'curso', label: 'Curso', type: 'text', required: false },
          { id: 'seccion', label: 'Sección', type: 'text', required: false },
          { id: 'fecha', label: 'Fecha', type: 'date', required: false },
          { id: 'intento', label: 'Número de intento', type: 'number', required: false },
        ],
      },
    },
  });

  console.log('Seed completado. Examen demo creado con ID:', exam.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
