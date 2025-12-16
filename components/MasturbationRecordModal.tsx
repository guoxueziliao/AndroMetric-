
import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { X, Check, Clock, Smile, PenLine, Tag, Smartphone, User, Target, Layers, Plus, Zap, Minus, FilePlus, Bookmark, ShieldCheck, Trash2, ArrowLeft, ArrowRight, MapPin, AlertTriangle, Search, Battery, Droplets, BatteryCharging, Wind, Film, Edit2, Globe, Activity, Thermometer, BrainCircuit, ChevronDown, UserCheck, Shirt, Gamepad2, BookOpen, MonitorPlay, Sparkles, Hash, Settings } from 'lucide-react';
import { MasturbationRecordDetails, LogEntry, PartnerProfile, Mood, MasturbationMaterial } from '../types';
import Modal from './Modal';
import { calculateInventory } from '../utils/helpers';
import { useToast } from '../contexts/ToastContext';

// Lazy load to avoid circular dependency issues in some builds
const TagManager = lazy(() => import('./TagManager'));

interface MasturbationRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (details: MasturbationRecordDetails) => void;
  initialData?: MasturbationRecordDetails;
  dateStr: string;
  logs?: LogEntry[];
  partners?: PartnerProfile[];
}

// --- CONSTANTS ---

const SOURCES = ['视频', '直播', '图片', '文爱', '回忆', '幻想', '音声', '漫画'];
const PLATFORMS = ['Telegram', 'ONE', 'Pornhub', 'Twitter', 'Xvideos', 'OnlyFans', 'Jable', 'TikTok', '微信/QQ', '本地硬盘', '91', 'MissAV'];

const TOOL_OPTIONS = ['手', '润滑液', '飞机杯', '名器/倒模', '电动玩具', '前列腺按摩器', '枕头'];
const SCENE_OPTIONS = ['书桌/电脑前', '卧室/床上', '浴室/洗澡', '厕所/马桶', '客厅/沙发', '阳台', '车里', '公司/学校', '野外', '站立'];
const INTERRUPTION_OPTIONS = ['🚪 有人敲门', '📞 电话/微信', '🐱 猫/狗捣乱', '🚴‍♂️ 外卖/快递', '👁️ 突然被看到', '🔊 噪音干扰'];

const LUBRICANT_TYPES = ['水溶性', '油性', '硅基', '唾液', '乳液'];

const FORCE_LEVELS = [
    { lvl: 1, label: '滞留/干涩', desc: '几乎没出来，黏在根部' },
    { lvl: 2, label: '流出/易理', desc: '缓缓流出，一张纸轻松搞定' },
    { lvl: 3, label: '喷射/标准', desc: '有明显的喷射节奏' },
    { lvl: 4, label: '汹涌/湿透', desc: '量大浓厚，纸巾完全湿透' },
    { lvl: 5, label: '爆发/穿透', desc: '极强冲力，射穿或喷射极远' },
];

const FATIGUE_OPTIONS = ['精神焕发', '无明显疲劳', '轻微困倦', '身体沉重', '秒睡'];
const POST_MOOD_OPTIONS = ['满足/愉悦', '平静/贤者', '空虚/后悔', '焦虑/负罪', '恶心/厌恶'];

// Organized Categories (XP)
const XP_GROUPS: Record<string, string[]> = {
    '角色': [
        '人妻', '熟女', '学生/JK', '少女', '御姐', '萝莉', '女上司', '秘书', '护士', '老师', '空姐', '女仆', '修女', '运动员', '邻居', '朋友', '近亲', '姐姐', '妈妈', '女儿', '孕妇', '偶像', '姐弟', '母子', '师生', '夫妻', '上司', '下属',
        '老板', '医生', '主人', '母亲', '宠物', '警察', '公主', '机器人', '奴隶', '服从者', '嫂子', '保姆', '姻亲', 'OL', '办公女郎', '女员工', '离异', '主播', '清洁工', '未婚妻', '新娘', '公公', '小叔子', '快递员', '导演', '前任', '姐妹', '闺蜜', '粉丝', '同事', '模特', '摄影师', '经纪人', '小姨子', '宅女', '毕业生', '辅导老师', '技师', '富家女', '女经理', '新人'
    ],
    '身体': [
        '巨乳', '贫乳', '美乳', '爆乳', '垂乳', '美腿', '足控', '巨臀', '美臀', '颜值', '身材', '肤白', '黑皮', '辣妹', '纹身', '穿环', '油亮', '多毛', '无毛', '美尻',
        '腹部', '金发', '体毛', '乳房', '臀部', '曲线', '耳朵', '眼睛', '脚', '雀斑', '头发', '手', '腿', '嘴唇', '肌肉', '肚脐', '鼻子', '孕肚', '阴毛', '疤痕', '皮肤', '苗条', '小乳', '高挑', '牙齿', '瘦弱', '脚趾', '皱纹', '阿姨', '眼镜', '土味', '中年', '修长', '长腿', '火辣', '风韵'
    ],
    '装扮': [
        '黑丝', '白丝', '网袜', '高跟', '制服', '西装', '眼镜', '口罩', '内衣', '情趣内衣', '丁字裤', '免脱', '胶衣', '皮革', '按摩棒', '假阴茎', '跳蛋', '项圈', '手铐',
        '比基尼', '眼罩', '靴子', '紧身胸衣', '服装', '鞭子', '裙子', '羽毛', '手套', '安全带', '帽子', '丝袜', '乳胶', '面具', '拍子', '肛塞', '警察服', '绳子', '校服', '泳装', '尾巴', '领带', '婚纱', '快递服', '舞台服', 'OL制服'
    ],
    '玩法': [
        '口交', '手交', '乳交', '足交', '肛交', '深喉', '69', '骑乘', '后入', '传教士', '侧入', '内射', '颜射', '口爆', '吞精', '中出', '多发', '潮吹', '失禁', 'SM', '调教', '捆绑', '窒息', 'SP', '打屁股', '3P', '群P', '轮奸',
        '咬', '蒙眼', '舔阴', '双插', '边缘控制', '电击', '脸坐', '指交', '拳交', '强制高潮', '群交', '冲击', '挑逗', '温度', '触手', '搔痒', '舔肛', '角色反转', '抓挠', '感官剥夺', '绳艺', '拍打', '女插男', '宠物扮演', '蜡烛', '鞭打', '直播', '下药', '媚药', '多人', '女王', '灌醉', '威胁', '诱惑', '游戏', '按摩', '足控'
    ],
    '剧情': [
        '纯爱', '温柔', '剧情', '调情', '接吻', 'NTR', '出轨', '寝取', '绿帽', '强迫', '勒索', '睡眠', '羞耻', '露出', '受辱', '堕落', '恶堕', '催眠', '时间停止', '强制', '凌辱', '乱伦', '禁忌', '家中', '户外', '车内', '办公室', '卧室', '校园', '酒店', '按摩店', '会议室', '同事家',
        '通奸', '洗脑', '支配', '幻想', '不忠', '嫉妒', '操纵', '痴迷', '赞美', '惩罚', '复仇', '斯德哥尔摩', '服从', '训练', '家庭', '照顾', '依赖', '离婚', '胁迫', '救助', '英雄救美', '偷窥', '职业', '暧昧', '订婚', '婚前', '报复', '欺骗', '小三', '补习', '寂寞', '修复', '上门', '一见钟情', '误会', '复合', '霸凌', '骚扰', '借宿', '吃醋', '多角关系', '沦陷', '单恋', '暗恋', '报复心理', '觉醒', '愤怒', '倦怠', '无聊', '重燃', '抗拒', '情意', '极致', '摄影棚', '后台'
    ],
    '风格': [
        '真人', '二次元', '动漫', '3D', '建模', 'Cosplay', 'AI生成', 'VR', '全景', 'MMD', 'PMV', '有声', 'ASMR', '漫画', '本子', '小说', '文爱', '硬核', '唯美', '艺术', '写实', 'POV', '淫乱', '痴女', '清纯', '害羞', '高冷', '顺从', '反抗', 'S属性', 'M属性',
        '2D', '渲染', '音频', '手绘', '同人', 'Hentai', '插图', '拍摄', '舞蹈', 'MV', '文字', '虚拟现实', '网络漫画', '混乱', '冷酷', '可爱', '优雅', '极端', '激烈', '轻松', '神秘', '调皮', '浪漫', '粗暴', '施虐', '感官', '柔软', '甜蜜', '禁忌', '挑逗', '欧美', '日韩', '国产', '韩国', '美国', '欧洲', '亚洲', '泰国', '俄罗斯', '巴西', '印度', '麻豆', '啄木鸟', 'Vixen', 'SOD', 'S1', 'Faleno', 'JAV', 'Brazzers', 'Black', 'Evil Angel', 'Tushy', 'Pure Taboo', 'X-Art', 'MetArt', 'FemJoy', '解说', 'AI视频', 'AI换脸', 'Deepfake'
    ]
};

const MasturbationRecordModal: React.FC<MasturbationRecordModalProps> = ({ isOpen, onClose, onSave, initialData, dateStr, logs = [], partners = [] }) => {
    const { showToast } = useToast();
    
    // --- State ---
    const [data, setData] = useState<MasturbationRecordDetails>({
        id: '',
        startTime: '',
        duration: 15,
        status: 'completed',
        tools: ['手'],
        materials: [],
        props: [],
        assets: { sources: [], platforms: [], categories: [], target: '', actors: [] },
        materialsList: [],
        edging: 'none',
        edgingCount: 0,
        lubricant: '',
        useCondom: false,
        ejaculation: true,
        orgasmIntensity: 3,
        mood: 'neutral',
        stressLevel: 3,
        energyLevel: 3,
        interrupted: false,
        interruptionReasons: [],
        notes: '',
        volumeForceLevel: 3,
        postMood: '平静/贤者',
        fatigue: '无明显疲劳'
    });

    const [activeCategoryTab, setActiveCategoryTab] = useState<string>('常用');
    const [categorySearch, setCategorySearch] = useState('');
    const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);

    const inventoryTime = useMemo(() => calculateInventory(logs), [logs]);

    // Compute Frequent Tags from logs
    const frequentTags = useMemo(() => {
        const counts: Record<string, number> = {};
        logs.forEach(log => {
            log.masturbation?.forEach(m => {
                m.assets?.categories?.forEach(c => {
                    counts[c] = (counts[c] || 0) + 1;
                });
            });
        });
        // Sort descending
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 30)
            .map(x => x[0]);
    }, [logs]);

    const activeTags = useMemo(() => {
        if (categorySearch) {
            // Search across all groups
            const allTags = new Set<string>();
            Object.values(XP_GROUPS).forEach(list => list.forEach(t => allTags.add(t)));
            return Array.from(allTags).filter(t => t.toLowerCase().includes(categorySearch.toLowerCase()));
        }
        if (activeCategoryTab === '常用') {
            return frequentTags.length > 0 ? frequentTags : XP_GROUPS['角色']; // Fallback if no history
        }
        return XP_GROUPS[activeCategoryTab] || [];
    }, [activeCategoryTab, frequentTags, categorySearch]);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                // Ensure Assets object structure is fully populated even if legacy data is missing it
                const baseAssets = (initialData.assets || {}) as any;
                setData({
                    ...initialData,
                    assets: { 
                        sources: baseAssets.sources || [], 
                        platforms: baseAssets.platforms || [], 
                        categories: baseAssets.categories || [], 
                        target: baseAssets.target || '', 
                        actors: baseAssets.actors || [] 
                    },
                    materialsList: initialData.materialsList || [],
                    // V2 defaults
                    volumeForceLevel: initialData.volumeForceLevel || (initialData.ejaculation ? 3 : undefined),
                    postMood: initialData.postMood || '平静/贤者',
                    fatigue: initialData.fatigue || '无明显疲劳',
                    // Restore state sliders defaults if missing
                    stressLevel: initialData.stressLevel ?? 3,
                    energyLevel: initialData.energyLevel ?? 3,
                    edgingCount: initialData.edgingCount ?? 0
                });
            } else {
                setData({
                    id: Date.now().toString(),
                    startTime: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                    duration: 15,
                    status: 'completed',
                    tools: ['手'],
                    materials: [],
                    props: [],
                    assets: { sources: [], platforms: [], categories: [], target: '', actors: [] },
                    materialsList: [],
                    edging: 'none',
                    edgingCount: 0,
                    lubricant: '',
                    useCondom: false,
                    ejaculation: true,
                    orgasmIntensity: 3,
                    mood: 'neutral',
                    stressLevel: 3,
                    energyLevel: 3,
                    interrupted: false,
                    interruptionReasons: [],
                    notes: '',
                    volumeForceLevel: 3,
                    postMood: '平静/贤者',
                    fatigue: '无明显疲劳'
                });
            }
            setCategorySearch('');
            setActiveCategoryTab('常用');
        }
    }, [initialData, isOpen]);

    // --- Handlers ---

    const updateData = (field: keyof MasturbationRecordDetails, value: any) => {
        setData(prev => ({ ...prev, [field]: value }));
    };

    const updateAssets = (field: keyof typeof data.assets, value: any) => {
        setData(prev => ({
            ...prev,
            assets: { ...(prev.assets || {}), [field]: value } as any
        }));
    };

    const toggleAssetItem = (field: 'sources' | 'platforms' | 'categories', item: string) => {
        const current = data.assets?.[field] || [];
        const next = current.includes(item) ? current.filter(x => x !== item) : [...current, item];
        updateAssets(field, next);
    };

    const handleSelectTagFromManager = (tag: string) => {
        toggleAssetItem('categories', tag);
        setIsTagManagerOpen(false);
    };

    const toggleTool = (tool: string) => {
        const current = data.tools || [];
        const next = current.includes(tool) ? current.filter(x => x !== tool) : [...current, tool];
        updateData('tools', next);
    };

    const handleSave = () => {
        // Sync edging status based on count
        const finalData = { ...data };
        if (finalData.edgingCount && finalData.edgingCount > 0) {
            finalData.edging = finalData.edgingCount === 1 ? 'once' : 'multiple';
        } else {
            finalData.edging = 'none';
        }
        onSave(finalData);
    };

    const incrementEdging = () => updateData('edgingCount', (data.edgingCount || 0) + 1);
    const decrementEdging = () => updateData('edgingCount', Math.max(0, (data.edgingCount || 0) - 1));

    if (!isOpen) return null;

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={initialData ? "编辑自慰记录" : "记录施法"}
            footer={
                <button onClick={handleSave} className="w-full py-3 bg-brand-accent text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center">
                    <Check size={20} className="mr-2"/> 保存记录
                </button>
            }
        >
            <div className="space-y-6 pb-4">
                
                {/* 0. Inventory */}
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-3 text-white flex items-center justify-between shadow-md">
                    <div className="flex items-center gap-2">
                        <BatteryCharging size={20} className="text-yellow-300 animate-pulse"/>
                        <span className="text-xs font-bold uppercase tracking-wider opacity-90">当前蓄力 (INVENTORY)</span>
                    </div>
                    <span className="font-black text-lg tracking-tight">{inventoryTime}</span>
                </div>

                {/* 1. Time & Duration */}
                <div className="flex gap-4">
                    <div className="flex-1 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                        <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">开始时间</label>
                        <div className="flex items-center justify-between">
                            <input 
                                type="time" 
                                value={data.startTime} 
                                onChange={e => updateData('startTime', e.target.value)}
                                className="bg-transparent text-xl font-mono font-bold text-brand-text dark:text-slate-200 outline-none w-full"
                            />
                            <Clock size={18} className="text-slate-300"/>
                        </div>
                    </div>
                    <div className="flex-1 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                        <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">持续时长 (分)</label>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center w-full">
                                <button type="button" onClick={() => updateData('duration', Math.max(1, (data.duration||0)-5))} className="p-1 rounded-full hover:bg-slate-100 text-slate-400"><Minus size={14}/></button>
                                <input 
                                    type="number" 
                                    value={data.duration} 
                                    onChange={e => updateData('duration', parseInt(e.target.value) || 0)}
                                    className="bg-transparent text-xl font-mono font-bold text-brand-text dark:text-slate-200 outline-none w-full text-center"
                                />
                                <button type="button" onClick={() => updateData('duration', (data.duration||0)+5)} className="p-1 rounded-full hover:bg-slate-100 text-slate-400"><Plus size={14}/></button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Content (Material & XP) */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center"><Film size={14} className="mr-1.5"/> 施法素材 (Content)</h3>
                    
                    {/* Basic Tags */}
                    <div className="space-y-3">
                        {/* Source */}
                        <div className="flex flex-wrap gap-2">
                            {SOURCES.map(src => (
                                <button 
                                    key={src} 
                                    onClick={() => toggleAssetItem('sources', src)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${data.assets?.sources?.includes(src) ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500'}`}
                                >
                                    {src}
                                </button>
                            ))}
                        </div>
                        {/* Platform */}
                        {(data.assets?.sources?.includes('视频') || data.assets?.sources?.includes('直播')) && (
                            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                                {PLATFORMS.map(pf => (
                                    <button 
                                        key={pf} 
                                        onClick={() => toggleAssetItem('platforms', pf)}
                                        className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${data.assets?.platforms?.includes(pf) ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300' : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                                    >
                                        {pf}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* XP Categories (Improved) */}
                    <div className="pt-2">
                        <label className="text-xs font-bold text-slate-400 mb-2 flex items-center justify-between">
                            <span>类型 / 性癖</span>
                            <span className="text-[10px] font-normal">{data.assets?.categories?.length || 0} selected</span>
                        </label>
                        
                        {/* XP Tabs */}
                        <div className="flex gap-1 overflow-x-auto scrollbar-hide mb-2 border-b border-slate-200 dark:border-slate-700 pb-1">
                            {['常用', '角色', '身体', '装扮', '玩法', '剧情', '风格'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => { setActiveCategoryTab(tab); setCategorySearch(''); }}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-t-lg transition-colors whitespace-nowrap ${
                                        activeCategoryTab === tab 
                                        ? 'bg-white dark:bg-slate-900 text-brand-accent border-b-2 border-brand-accent' 
                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Search Bar */}
                        <div className="relative mb-2 flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-2 top-2 text-slate-400" size={12}/>
                                <input 
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-1.5 pl-7 pr-2 text-xs focus:border-brand-accent outline-none"
                                    placeholder="搜索标签..."
                                    value={categorySearch}
                                    onChange={e => setCategorySearch(e.target.value)}
                                />
                            </div>
                            <button onClick={() => setIsTagManagerOpen(true)} className="px-3 bg-slate-200 dark:bg-slate-700 text-slate-500 rounded-lg text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors" title="管理或创建标签">
                                <Settings size={14}/>
                            </button>
                        </div>

                        {/* Tags Grid */}
                        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto custom-scrollbar content-start p-1">
                            {activeTags.map(cat => (
                                <button 
                                    key={cat}
                                    onClick={() => toggleAssetItem('categories', cat)}
                                    className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200 border ${
                                        data.assets?.categories?.includes(cat) 
                                        ? 'bg-brand-accent text-white border-brand-accent shadow-sm' 
                                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-brand-accent/50'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                            {activeTags.length === 0 && (
                                <div className="w-full text-center py-4">
                                    <p className="text-xs text-slate-400 mb-2">无匹配标签</p>
                                    <button 
                                        onClick={() => setIsTagManagerOpen(true)}
                                        className="text-brand-accent text-xs font-bold hover:underline"
                                    >
                                        前往标签管理创建 "{categorySearch}"
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Target/Partner */}
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                        <label className="text-xs font-bold text-slate-400 mb-2 block">施法对象 (Target)</label>
                        {/* Partner Quick Select */}
                        {partners.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto pb-2 mb-2 scrollbar-hide">
                                {partners.map(p => (
                                    <button 
                                        key={p.id}
                                        onClick={() => updateAssets('target', p.name)}
                                        className={`flex-shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-full border transition-all ${data.assets?.target === p.name ? 'bg-pink-100 text-pink-700 border-pink-200' : 'bg-white text-slate-500 border-slate-200'}`}
                                    >
                                        <div className={`w-4 h-4 rounded-full ${p.avatarColor || 'bg-slate-400'}`}></div>
                                        <span className="text-[10px] font-bold">{p.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                        <input 
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs focus:border-brand-accent outline-none"
                            placeholder="网黄 / 明星 / 角色名 / 伴侣..."
                            value={data.assets?.target || ''}
                            onChange={e => updateAssets('target', e.target.value)}
                        />
                    </div>
                </div>

                {/* 3. Action & Tools */}
                <div className="space-y-4">
                    {/* Tools */}
                    <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">辅助工具 (Tools)</h4>
                        <div className="flex flex-wrap gap-2">
                            {TOOL_OPTIONS.map(tool => (
                                <button
                                    key={tool}
                                    onClick={() => toggleTool(tool)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${data.tools?.includes(tool) ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-500'}`}
                                >
                                    {tool}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Lubricant & Condom */}
                    <div className="flex gap-2">
                        <div className="flex-1 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl flex items-center gap-2 border border-slate-100 dark:border-slate-700">
                            <Droplets size={16} className="text-blue-400 ml-1"/>
                            <select 
                                className="bg-transparent w-full text-xs font-bold outline-none text-slate-600 dark:text-slate-300"
                                value={data.lubricant || ''}
                                onChange={e => updateData('lubricant', e.target.value)}
                            >
                                <option value="">无润滑</option>
                                {LUBRICANT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <button 
                            onClick={() => updateData('useCondom', !data.useCondom)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1 ${data.useCondom ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-50 text-slate-400 border-transparent'}`}
                        >
                            <ShieldCheck size={14}/> 戴套
                        </button>
                    </div>

                    {/* Edging */}
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Activity size={16} className="text-purple-500"/>
                            <div>
                                <div className="text-xs font-bold text-slate-600 dark:text-slate-300">边缘控制 (Edging)</div>
                                <div className="text-[10px] text-slate-400">快射时停下</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={decrementEdging} className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 shadow flex items-center justify-center text-slate-500"><Minus size={14}/></button>
                            <span className="font-mono font-bold text-lg w-4 text-center">{data.edgingCount || 0}</span>
                            <button onClick={incrementEdging} className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 shadow flex items-center justify-center text-purple-500"><Plus size={14}/></button>
                        </div>
                    </div>
                </div>

                {/* 4. Outcome (Orgasm & Ejaculation) */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-4 shadow-sm">
                    <div className="flex justify-between items-center">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">最终结局</h4>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => updateData('ejaculation', !data.ejaculation)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${data.ejaculation ? 'bg-blue-500 text-white border-blue-600' : 'bg-slate-100 text-slate-400 border-transparent'}`}
                            >
                                {data.ejaculation ? '已射精' : '未射精 (寸止)'}
                            </button>
                        </div>
                    </div>

                    {/* V2: Volume & Force */}
                    {data.ejaculation && (
                        <div className="space-y-3 animate-in fade-in pt-2 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-blue-600 flex items-center"><Wind size={12} className="mr-1"/> 射精强度 (量/力)</label>
                                <span className="text-xs font-mono font-bold bg-blue-100 text-blue-700 px-1.5 rounded">Lv.{data.volumeForceLevel}</span>
                            </div>
                            <div className="flex justify-between gap-1">
                                {FORCE_LEVELS.map(l => (
                                    <button 
                                        key={l.lvl}
                                        onClick={() => updateData('volumeForceLevel', l.lvl)}
                                        className={`flex-1 h-10 rounded-lg flex flex-col items-center justify-center transition-all border ${data.volumeForceLevel === l.lvl ? 'bg-blue-50 border-blue-400 text-blue-600 shadow-sm' : 'bg-slate-50 border-transparent text-slate-300'}`}
                                        title={l.desc}
                                    >
                                        <div className={`w-2 h-2 rounded-full mb-1 ${data.volumeForceLevel! >= l.lvl ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                                        <span className="text-[9px] font-bold scale-90">{l.label.split('/')[0]}</span>
                                    </button>
                                ))}
                            </div>
                            <p className="text-[10px] text-slate-400 text-center italic">
                                {FORCE_LEVELS.find(l => l.lvl === data.volumeForceLevel)?.desc}
                            </p>
                        </div>
                    )}

                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between text-xs font-bold text-slate-500">
                            <span>愉悦感 ({data.orgasmIntensity})</span>
                            <span>{data.orgasmIntensity! >= 5 ? '🔥 极乐升天' : data.orgasmIntensity! >= 4 ? '😍 很爽' : data.orgasmIntensity! >= 3 ? '🙂 舒服' : '😐 一般'}</span>
                        </div>
                        <input 
                            type="range" min="1" max="5" step="1"
                            value={data.orgasmIntensity || 3}
                            onChange={e => updateData('orgasmIntensity', parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
                        />
                    </div>
                </div>

                {/* 5. Post-Clarity (Sage Mode) */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl space-y-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center"><Sparkles size={12} className="mr-1"/> 贤者时间 (Sage Mode)</h4>
                    
                    {/* Psychological */}
                    <div className="space-y-2">
                        <label className="text-[10px] text-slate-400 block">心理状态</label>
                        <div className="flex flex-wrap gap-2">
                            {POST_MOOD_OPTIONS.map(opt => (
                                <button
                                    key={opt}
                                    onClick={() => updateData('postMood', opt)}
                                    className={`px-2 py-1 rounded text-xs transition-all border ${data.postMood === opt ? 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300' : 'bg-white text-slate-500 border-slate-200 dark:bg-slate-900 dark:border-slate-700'}`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Physiological */}
                    <div className="space-y-2">
                        <label className="text-[10px] text-slate-400 block">身体疲劳度</label>
                        <div className="flex flex-wrap gap-2">
                            {FATIGUE_OPTIONS.map(opt => (
                                <button
                                    key={opt}
                                    onClick={() => updateData('fatigue', opt)}
                                    className={`px-2 py-1 rounded text-xs transition-all border ${data.fatigue === opt ? 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300' : 'bg-white text-slate-500 border-slate-200 dark:bg-slate-900 dark:border-slate-700'}`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 6. Notes */}
                <div className="relative">
                    <PenLine size={14} className="absolute left-3 top-3 text-slate-400" />
                    <textarea 
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-9 pr-4 text-xs outline-none focus:border-brand-accent min-h-[60px]"
                        placeholder="番号 / 链接 / 特殊感受..."
                        value={data.notes || ''}
                        onChange={e => updateData('notes', e.target.value)}
                    />
                </div>
            </div>

            {/* Tag Manager Modal (Nested) */}
            <Suspense fallback={null}>
                <TagManager 
                    isOpen={isTagManagerOpen} 
                    onClose={() => setIsTagManagerOpen(false)} 
                    onSelectTag={handleSelectTagFromManager}
                    initialSearch={categorySearch}
                />
            </Suspense>
        </Modal>
    );
};

export default MasturbationRecordModal;
