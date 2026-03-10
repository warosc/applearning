import { Test, TestingModule } from '@nestjs/testing';
import { GradingService } from './grading.service';
import { PrismaService } from '../prisma/prisma.service';

describe('GradingService', () => {
  let service: GradingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GradingService,
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    service = module.get<GradingService>(GradingService);
  });

  it('should grade single_choice correctly', () => {
    const question = {
      type: 'single_choice',
      score: 10,
      options: [
        { value: 'a', isCorrect: false },
        { value: 'b', isCorrect: true },
      ],
    };
    const correct = service.gradeAnswer(question, 'b');
    expect(correct.isCorrect).toBe(true);
    expect(correct.scoreObtained).toBe(10);
    const wrong = service.gradeAnswer(question, 'a');
    expect(wrong.isCorrect).toBe(false);
  });

  it('should grade numeric correctly', () => {
    const question = {
      type: 'numeric',
      score: 5,
      metadataJson: { expected: '42' },
      options: [],
    };
    expect(service.gradeAnswer(question, '42').isCorrect).toBe(true);
    expect(service.gradeAnswer(question, ' 42 ').isCorrect).toBe(true);
  });
});
