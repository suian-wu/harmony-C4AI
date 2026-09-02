"use client";

import { useState } from 'react';
import { Loader2, Music, Sparkles } from 'lucide-react';

type ConfigOption = {
  id: string;
  name: string;
  icon: string;
};

type StoryResult = {
  title: string;
  mode: 'demo' | 'bailian';
  input: string;
  emotionClues: string[];
  companionGoal: string;
  pages: Array<{
    image: string;
    text: string;
  }>;
  parentAdvice: {
    response: string;
    question: string;
    followUp: string;
  };
  notice: string;
};

const DEMO_PROMPT = '今天画画分组时，他们没有先选我。不过没关系，我自己也可以。';

// --- 1. 定义数据 (保持不变) ---
const MODE_DATA = [
  { id: 'text', name: '文字输入', icon: '/images/keyboard.png' },
  { id: 'voice', name: '语音输入', icon: '/images/mic-small.png' },
];

const VOICE_DATA = [
  { id: 'mom', name: '温柔妈妈音', icon: '/images/voice1.png' },
  { id: 'brother', name: '活泼哥哥音', icon: '/images/voice2.png' },
  { id: 'owl', name: '智慧爷爷音', icon: '/images/voice3.png' },
  { id: 'frog', name: '搞怪宝宝音', icon: '/images/voice4.png' },
];

const STYLE_DATA = [
  { id: '3d', name: '3D童话', icon: '/images/type1.png' },
  { id: 'ghibli', name: '手绘动画', icon: '/images/type2.png' },
  { id: 'crayon', name: '蜡笔涂鸦', icon: '/images/type3.png' },
  { id: 'sticker', name: '贴纸风', icon: '/images/type4.png' },
  { id: 'lego', name: '积木风', icon: '/images/type5.png' },
];

// --- 2. 配置按钮组件 (字体样式微调) ---
const ConfigIcon = ({
  data,
  active,
  onClick,
  size = 'md',
}: {
  data: ConfigOption;
  active: boolean;
  onClick: () => void;
  size?: 'md' | 'lg';
}) => (
  <button 
    onClick={onClick}
    className="group flex flex-col items-center transition-transform hover:scale-110 active:scale-95"
  >
    <div className={`relative transition-all ${
      size === 'lg' 
        ? 'w-32 h-32 md:w-44 md:h-44' // 稍微调大了一点点大号图标
        : 'w-24 h-24 md:w-32 md:h-32' // 稍微调大了一点点中号图标
    } mb-3`}>
      <img 
        src={data.icon} 
        alt={data.name} 
        className={`w-full h-full object-contain transition-all ${
          active ? 'brightness-110 drop-shadow-[0_0_20px_rgba(251,191,36,0.9)]' : 'grayscale-[0.2] opacity-90'
        }`} 
      />
      {active && (
        <div className="absolute -inset-4 border-[3px] border-amber-400 rounded-[2rem] animate-pulse" />
      )}
    </div>

    {/* 修改这里的文字样式：向标题风格靠拢 */}
    <span className={`
      text-sm md:text-xl font-black tracking-wide px-4 py-1.5 rounded-full transition-all
      drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)]
      ${active 
        ? 'bg-orange-600 text-[#FFF176] ring-2 ring-amber-400/50' 
        : 'bg-black/40 text-amber-50/90'
      }
    `}>
      {data.name}
    </span>
  </button>
);

{/* 标题通用样式变量（方便你以后一键修改） */}
const headerStyle = "text-[#FFF176] font-black mb-6 px-8 py-2 bg-orange-950/60 rounded-full text-xl md:text-3xl backdrop-blur-md tracking-[0.2em] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] border border-amber-500/20";

export default function StoryBookApp() {
  const [scene, setScene] = useState<'home' | 'config' | 'loading' | 'reading'>('home');
  const [result, setResult] = useState<StoryResult | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [inputMode, setInputMode] = useState('voice'); 
  const [voice, setVoice] = useState('mom');
  const [style, setStyle] = useState('3d');
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState('');

  const totalPages = result?.pages.length ?? 0;

  const handleGenerate = async () => {
    const storyInput = prompt.trim() || DEMO_PROMPT;
    setScene('loading');
    setError('');

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: storyInput, style, voice }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '生成失败，请稍后重试。');
      }

      setPrompt(storyInput);
      setResult(data as StoryResult);
      setCurrentPage(0);
      setScene('reading');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '生成失败，请稍后重试。');
      setScene('home');
    }
  };

  const handleSpeak = () => {
    if (!result || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(result.pages[currentPage].text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <>
      {/* 注入卡通字体 (站酷快乐体) */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=ZCOOL+KuaiLe&display=swap');
        
        .font-cartoon {
          font-family: 'ZCOOL KuaiLe', "Microsoft YaHei", cursive !important;
        }
        
        /* 针对输入框的占位符样式 */
        ::placeholder {
          font-family: 'ZCOOL KuaiLe', cursive;
          opacity: 0.6;
        }
      `}</style>

      {/* 将 font-sans 换成 font-cartoon */}
      <main className="relative w-full h-screen bg-stone-900 flex items-center justify-center overflow-hidden font-cartoon select-none">
        
        <div className="relative aspect-video h-full max-w-full overflow-hidden shadow-2xl bg-black">
          
          {/* --- 首页 --- */}
          {scene === 'home' && (
            <div className="absolute inset-0 animate-in fade-in duration-700">
              <img src="/images/bg-home.png" className="w-full h-full object-cover" />
              
              <div className="absolute top-[0%] left-[5%] w-32 md:w-44">
                <img src="/images/shelf.png" alt="书架" className="hover:rotate-3 transition-transform cursor-pointer" />
              </div>
              
               <div className="absolute top-[-5%] left-1/2 -translate-x-1/2 w-[40%] md:w-[35%] flex flex-col items-center">
       <div className="relative w-full">
        {/* 木牌背景图 (如果你有单独的木牌素材) */}
        <img src="/images/title.png" alt="木牌" className="w-full h-auto drop-shadow-xl" />
        
        {/* 文字叠加层 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-4">
          <h1 className="text-4xl md:text-6xl font-black text-[#4A2C2A] tracking-wider drop-shadow-sm">
            童心译站
          </h1>
          <p className="text-xs md:text-sm font-bold text-[#6D4C41] mt-1 opacity-80">
            让每一种心情被认真听见
          </p>
        </div>
      </div>
    </div>

              <button onClick={() => setScene('config')} className="absolute top-[0%] right-[5%] w-40 group flex flex-col items-center">
                <img src="/images/go-to-config.png" className="group-hover:rotate-12 transition-transform drop-shadow-lg" />
                <div className="bg-black/60 text-white text-[20px] px-3 py-1 rounded-full mt-1">设置入口</div>
              </button>

              <div className="absolute top-[70%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center w-full">
  {inputMode === 'voice' ? (
    <div className="relative flex flex-col items-center">
      
      {/* 话筒上方的对话气泡 (增加视觉面积) */}
      <div className="absolute -top-20 -right-16 md:-top-24 md:-right-20 w-48 md:w-64 animate-bounce duration-[4000ms]">
        <div className="relative bg-white/90 backdrop-blur-sm p-4 md:p-6 rounded-[2.5rem] border-[3px] border-amber-200 shadow-xl">
           <p className="text-[#5D4037] text-sm md:text-lg font-bold leading-tight">
             按下按钮<br/>告诉我今天发生了什么故事吧~
           </p>
           {/* 气泡的小尾巴 */}
           <div className="absolute -bottom-3 left-10 w-6 h-6 bg-white/90 border-r-[3px] border-b-[3px] border-amber-200 rotate-45" />
        </div>
      </div>

      {/* 按钮主体 */}
      <button onClick={handleGenerate} className="relative group transition-transform hover:scale-110 active:scale-95">
        <div className="absolute inset-0 bg-orange-400/20 rounded-full blur-[100px] group-hover:bg-orange-400/40 transition-colors" />
        <img 
          src="/images/micro.png" 
          className="w-[350px] md:w-[480px] lg:w-[550px] relative z-10" 
        />
      </button>
      <p className="mt-2 rounded-full bg-black/60 px-5 py-2 text-sm font-bold text-amber-50 md:text-base">
        MVP演示：点击话筒将使用一段匿名示例经历
      </p>
      
    </div>
  ) : (
                  <div className="w-[60%] flex flex-col items-center gap-4">
                    <textarea 
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="例如：今天分组时没有人先选我，我有一点难过……"
                      className="w-full p-6 rounded-[2rem] bg-white/90 text-2xl border-4 border-amber-200 outline-none font-cartoon text-amber-900"
                      rows={3}
                    />
                    <button onClick={handleGenerate} className="px-12 py-4 bg-orange-500 text-white rounded-full font-bold text-3xl shadow-[0_6px_0_#c2410c] hover:translate-y-1 hover:shadow-[0_2px_0_#c2410c] transition-all">
                      去变魔法!
                    </button>
                  </div>
                )}
                {error && (
                  <div className="absolute top-[92%] rounded-full bg-red-900/80 px-6 py-3 text-lg font-bold text-white">
                    {error}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* --- 配置页 --- */}
          {scene === 'config' && (
            <div className="absolute inset-0 animate-in slide-in-from-bottom-10 duration-500">
              <img src="/images/bg-config.png" className="w-full h-full object-cover" />
              
              <button onClick={() => setScene('home')} className="absolute top-[0%] left-[5%] w-32 md:w-40 hover:scale-110 transition-transform">
                <img src="/images/back-to-home.png" alt="返回" />
              </button>

              <div className="absolute top-[14%] left-[18%] flex flex-col items-center">
                <h3 className={headerStyle}>输入模式</h3>

                <div className="flex gap-6 md:gap-10">
                  {MODE_DATA.map(m => (
                    <ConfigIcon key={m.id} data={m} active={inputMode === m.id} onClick={() => setInputMode(m.id)} />
                  ))}
                </div>
              </div>

              <div className="absolute top-[35%] right-[4%] flex flex-col items-center">
                <h3 className={headerStyle}>朗读音色</h3>
                <div className="flex flex-row gap-3 md:gap-5">
                  {VOICE_DATA.map(v => (
                    <ConfigIcon key={v.id} data={v} active={voice === v.id} onClick={() => setVoice(v.id)} />
                  ))}
                </div>
              </div>

              <div className="absolute bottom-[12%] left-[36%] -translate-x-1/2 flex flex-col items-center w-[80%]">
                <h3 className={headerStyle}>绘本风格</h3>
                <div className="flex justify-center gap-4 md:gap-8">
                  {STYLE_DATA.map(s => (
                    <ConfigIcon key={s.id} data={s} active={style === s.id} onClick={() => setStyle(s.id)} size="lg" />
                  ))}
                </div>
              </div>

              <div className="absolute top-[5%] left-[48%] -translate-x-1/2 flex flex-col items-center group cursor-pointer">
                <img src="/images/lock.png" className="w-86 md:w-64 group-hover:scale-110 transition-transform drop-shadow-2xl" />
                <span className="text-white font-bold mt-4 drop-shadow-lg text-2xl tracking-widest">进入家长模式</span>
              </div>
            </div>
          )}

          {/* --- 加载中 (文字加粗) --- */}
          {scene === 'loading' && (
             <div className="absolute inset-0 bg-stone-900 flex flex-col items-center justify-center">
                <Loader2 className="w-20 h-20 text-amber-500 animate-spin mb-6" />
                <p className="text-3xl text-white font-bold tracking-[0.2em] animate-pulse">正在绘制你的梦境...</p>
             </div>
          )}

          {/* --- 阅读页 (字体大小增强) --- */}
          {scene === 'reading' && result && (
            <div className="absolute inset-0 animate-in zoom-in duration-1000">
              <img src="/images/bg-reading.png" className="absolute inset-0 w-full h-full object-cover" />
              
              <div className="absolute inset-0 flex items-center justify-center p-8 md:p-12">
                <div key={`page-container-${currentPage}`} className="relative w-full max-w-5xl aspect-[1.6/1] bg-white/5 rounded-2xl flex shadow-2xl overflow-hidden border-[8px] border-white/10">
                  <div className="flex-1 relative bg-stone-100 flex items-center justify-center p-4">
                    <img src={result.pages[currentPage].image} className="max-w-full max-h-full object-contain rounded shadow-lg" alt="演示绘本插图" />
                  </div>

                  <div className="flex-1 bg-white p-6 md:p-9 flex flex-col items-center justify-center text-center">
                    <div className="mb-3 flex items-center gap-3">
                      <Sparkles className="w-9 h-9 text-amber-400" />
                      <h2 className="text-2xl font-black text-amber-900">{result.title}</h2>
                    </div>
                    <div className={`mb-4 rounded-full px-4 py-1 text-sm font-bold ${result.mode === 'demo' ? 'bg-amber-100 text-amber-900' : 'bg-violet-100 text-violet-900'}`}>
                      {result.mode === 'demo' ? '本地演示模式' : '百炼模型模式'}
                    </div>
                    <p className="text-xl md:text-2xl font-bold text-stone-800 leading-relaxed">
                      {result.pages[currentPage].text}
                    </p>
                    
                    <button onClick={handleSpeak} className="mt-5 flex items-center gap-2 rounded-full bg-amber-100 px-6 py-3 font-bold text-amber-900 transition-transform hover:scale-105">
                      <Music className="w-5 h-5" /> 朗读本页
                    </button>

                    {currentPage === totalPages - 1 && (
                      <div className="mt-4 w-full rounded-2xl border-2 border-emerald-100 bg-emerald-50 p-4 text-left text-sm text-emerald-950">
                        <p className="mb-1 font-black">家长陪伴建议</p>
                        <p>{result.parentAdvice.response}</p>
                        <p className="mt-1">{result.parentAdvice.question}</p>
                        <p className="mt-1">{result.parentAdvice.followUp}</p>
                      </div>
                    )}

                    <p className="mt-3 text-xs text-stone-500">
                      {result.notice}
                    </p>
                    </div>
                  </div>
              </div>

              <div className="absolute bottom-6 inset-x-0 px-12 flex justify-between items-center">
                <button disabled={currentPage === 0} onClick={() => setCurrentPage(p => p - 1)} className="group flex flex-col items-center gap-1 disabled:opacity-30">
                  <img src="/images/previous-page.png" className="w-20 md:w-28 group-hover:scale-110 transition-all" />
                  <span className="text-white font-bold text-lg">上一页</span>
                </button>

                <div className="px-10 py-3 bg-orange-900/60 backdrop-blur-xl border-2 border-white/20 rounded-full text-white font-bold text-2xl tracking-tighter">
                  {currentPage + 1} <span className="text-sm mx-1">OF</span> {totalPages}
                </div>

                <button disabled={currentPage >= totalPages - 1} onClick={() => setCurrentPage(p => p + 1)} className="group flex flex-col items-center gap-1 disabled:opacity-30">
                  <img src="/images/next-page.png" className="w-20 md:w-28 group-hover:scale-110 transition-all" />
                  <span className="text-white font-bold text-lg">下一页</span>
                </button>
              </div>

              <button onClick={() => setScene('config')} className="absolute top-0 left-6">
                <img src="/images/back-to-home.png" className="w-32 md:w-32 hover:scale-110 transition-transform" />
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
