import { createPrompt, updatePrompt, listPrompts, deletePrompt } from '../promptService';
import { prisma } from '@/lib/prisma';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    prompt: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
    },
    promptTag: {
      deleteMany: jest.fn(),
    },
    promptVersion: {
      findFirst: jest.fn(),
    },
  },
}));

describe('promptService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPrompt', () => {
    it('should create prompt with tags and initial version', async () => {
      const input = {
        title: 'Test Prompt',
        content: 'Hello {{name}}',
        tags: ['test', 'example'],
      };

      const mockPrompt = {
        id: '1',
        ...input,
        systemPrompt: null,
        category: null,
        notes: null,
        isFavorite: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [{ tag: 'test' }, { tag: 'example' }],
        versions: [{ versionNumber: 1, content: input.content }],
      };

      (prisma.prompt.create as jest.Mock).mockResolvedValue(mockPrompt);

      const result = await createPrompt(input);

      expect(result).toEqual(mockPrompt);
      expect(prisma.prompt.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: input.title,
          content: input.content,
          tags: {
            create: [{ tag: 'test' }, { tag: 'example' }],
          },
          versions: {
            create: expect.objectContaining({
              versionNumber: 1,
              content: input.content,
            }),
          },
        }),
        include: { tags: true, versions: true },
      });
    });
  });

  describe('listPrompts', () => {
    it('should list prompts with pagination', async () => {
      const mockPrompts = [
        { id: '1', title: 'Prompt 1' },
        { id: '2', title: 'Prompt 2' },
      ];

      (prisma.prompt.findMany as jest.Mock).mockResolvedValueOnce(mockPrompts);
      (prisma.prompt.count as jest.Mock).mockResolvedValueOnce(10);

      const result = await listPrompts({ page: 1, limit: 2 });

      expect(result).toHaveProperty('data');
      expect(result.total).toBe(10);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(2);
      expect(result.totalPages).toBe(5);
    });

    it('should filter by search term', async () => {
      (prisma.prompt.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.prompt.count as jest.Mock).mockResolvedValue(0);

      await listPrompts({ search: 'test' });

      expect(prisma.prompt.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: expect.arrayContaining([
              { title: { contains: 'test' } },
              { content: { contains: 'test' } },
              { notes: { contains: 'test' } },
            ]),
          },
          skip: 0,
          take: 20,
          orderBy: { updatedAt: 'desc' },
        })
      );
    });
  });
});
