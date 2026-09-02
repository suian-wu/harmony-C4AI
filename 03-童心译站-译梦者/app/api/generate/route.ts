import { NextResponse } from 'next/server';

type StoryPage = {
  image: string;
  text: string;
};

type StoryResult = {
  title: string;
  mode: 'demo' | 'bailian';
  input: string;
  emotionClues: string[];
  companionGoal: string;
  pages: StoryPage[];
  parentAdvice: {
    response: string;
    question: string;
    followUp: string;
  };
  notice: string;
};

const STYLE_IMAGES: Record<string, string[]> = {
  '3d': ['/images/type1.png', '/images/type2.png', '/images/type3.png'],
  ghibli: ['/images/type2.png', '/images/type3.png', '/images/type4.png'],
  crayon: ['/images/type3.png', '/images/type4.png', '/images/type5.png'],
  sticker: ['/images/type4.png', '/images/type5.png', '/images/type1.png'],
  lego: ['/images/type5.png', '/images/type1.png', '/images/type2.png'],
};

function createDemoStory(prompt: string, style = '3d', generatedText?: string): StoryResult {
  const images = STYLE_IMAGES[style] ?? STYLE_IMAGES['3d'];
  const modelText = generatedText?.trim();

  return {
    title: '《最后被点亮的小星星》',
    mode: modelText ? 'bailian' : 'demo',
    input: prompt,
    emotionClues: ['可能有一点失落', '希望被伙伴看见', '也在努力保护自己'],
    companionGoal: '先确认感受，再帮助孩子练习表达“我也想加入”。',
    pages: [
      {
        image: images[0],
        text: `今天，小星星想起了这件事：“${prompt}”它嘴上说没关系，心里却像飘来了一小片雨云。`,
      },
      {
        image: images[1],
        text: modelText
          ? `星光伙伴认真听完后，为它写下了一段话：${modelText.slice(0, 180)}`
          : '星光伙伴没有急着让它勇敢，而是轻轻地说：“没有被先选中，感到失落也很正常。你的感受值得被听见。”',
      },
      {
        image: images[2],
        text: '第二天，小星星试着对伙伴说：“我也想加入，可以吗？”无论结果怎样，它都为自己愿意表达而亮起了一束新的光。',
      },
    ],
    parentAdvice: {
      response: '可以先说：“没有被先选中，可能真的会让人有些失落。我愿意听你讲讲。”',
      question: '共读时可以问：“如果你是小星星，你希望伙伴知道什么？”',
      followUp: '和孩子练习一句简单表达：“我也想加入，可以吗？”',
    },
    notice: modelText
      ? '本次故事使用百炼返回文本生成；插图仍为MVP演示素材。'
      : '当前未配置可用模型，系统返回明确标注的本地演示故事，用于验证完整交互闭环。',
  };
}

function extractGeneratedText(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined;

  const value = data as {
    output?: { text?: unknown; result?: unknown } | unknown;
    text?: unknown;
  };

  if (typeof value.text === 'string') return value.text;
  if (value.output && typeof value.output === 'object') {
    const output = value.output as { text?: unknown; result?: unknown };
    if (typeof output.text === 'string') return output.text;
    if (typeof output.result === 'string') return output.result;
  }

  return undefined;
}

export async function GET() {
  const configured = Boolean(process.env.DASHSCOPE_API_KEY && process.env.BAILIAN_APP_ID);

  return NextResponse.json({
    ok: true,
    service: '童心译站 MVP',
    mode: configured ? 'bailian' : 'demo',
    message: configured
      ? '百炼环境变量已配置，可尝试调用模型。'
      : '未配置百炼环境变量，将使用本地演示数据验证流程。',
  });
}

export async function POST(req: Request) {
  let prompt = '';
  let style = '3d';

  try {
    const body = (await req.json()) as { prompt?: unknown; style?: unknown };
    prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
    style = typeof body.style === 'string' ? body.style : '3d';

    if (!prompt) {
      return NextResponse.json({ error: '请先输入一段当天发生的事情。' }, { status: 400 });
    }

    if (prompt.length > 500) {
      return NextResponse.json({ error: '为了保护儿童隐私并保持生成稳定，输入请控制在500字以内。' }, { status: 400 });
    }

    const apiKey = process.env.DASHSCOPE_API_KEY;
    const appId = process.env.BAILIAN_APP_ID;

    if (!apiKey || !appId) {
      return NextResponse.json(createDemoStory(prompt, style));
    }

    const response = await fetch(`https://dashscope.aliyuncs.com/api/v1/apps/${appId}/completion`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: { prompt },
        parameters: {},
        debug: {},
      }),
      signal: AbortSignal.timeout(30000),
    });

    const data: unknown = await response.json();
    if (!response.ok) {
      console.error('百炼 API 调用失败，已降级为演示数据。', data);
      return NextResponse.json(createDemoStory(prompt, style));
    }

    return NextResponse.json(createDemoStory(prompt, style, extractGeneratedText(data)));
  } catch (error) {
    console.error('生成接口异常，已降级为演示数据。', error);

    if (prompt) return NextResponse.json(createDemoStory(prompt, style));

    return NextResponse.json({ error: '请求格式不正确，请重新输入。' }, { status: 400 });
  }
}
