import { motion } from 'framer-motion';
import { useState, useEffect } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ArrowUp, ArrowDown, Loader2, ArrowLeft, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
// import { fmt } from "@/lib/mock-data";
import { format, parseISO } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { fetchAntamPrices, fetchUbsPrices, GoldPriceItem } from "@/services/goldApi";
import { getPriceHistory, saveTodayPrice, PriceHistory } from "@/services/db";
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/context/UserContext';

const fmt = (n: number) =>
    n
        .toLocaleString('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        })
        .replace(/\u00A0/, ' ');
const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

// Komponen Tabel
function LiveScrapedTable({ title, data, hasBuyback }: { title: string, data: GoldPriceItem[], hasBuyback?: boolean }) {
    if (data.length === 0) return <div className="p-8 text-center text-sm border rounded-lg bg-card text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />Loading {title}...</div>;
    return (
        <div className="rounded-lg border bg-card overflow-hidden">
            <div className="p-3 border-b bg-muted/30"><h3 className="font-semibold text-sm">{title}</h3></div>
            <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground text-xs sticky top-0 backdrop-blur-md z-10">
                        <tr>
                            <th className="px-4 py-2">Pecahan</th>
                            <th className="px-4 py-2 text-right">Beli</th>
                            {hasBuyback && <th className="px-4 py-2 text-right">Jual</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {data.map((item, i) => (
                            <tr key={i} className="hover:bg-muted/30">
                                <td className="px-4 py-2 font-medium">{item.weight}</td>
                                <td className="px-4 py-2 text-right">{fmt(item.buyPrice)}</td>
                                {hasBuyback && <td className="px-4 py-2 text-right">{item.buybackPrice ? fmt(item.buybackPrice) : '-'}</td>}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-background border border-border p-3 rounded-lg shadow-lg text-xs z-50">
                <p className="font-semibold mb-2 pb-2 border-b border-border">{label}</p>
                <div className="space-y-1.5">
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center justify-between gap-6">
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                                <span
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: entry.color }}
                                />
                                {entry.name}
                            </span>
                            <span className="font-medium text-foreground">
                                {fmt(entry.value)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

// Komponen Bar Chart Baru
function GramPriceChart({ data, title }: { data: GoldPriceItem[]; title: string }) {
    if (data.length === 0) return <div className="p-8 text-center text-sm border rounded-lg bg-card text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />Loading {title}...</div>;

    const chartHeight = Math.max(350, data.length * 45);

    return (
        <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold mb-1">{title}</h3>
            <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm bg-primary/40" />Harga Jual</span>
                <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm bg-primary" />Harga Beli</span>
            </div>
            <ResponsiveContainer width="100%" height={chartHeight}>
                <BarChart data={data} layout="vertical" margin={{ left: 10, right: 40, top: 5, bottom: 5 }} barGap={2} barSize={12}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => { if (v >= 1000000) return `${(v / 1000000).toFixed(0)}jt`; return String(v); }} />
                    <YAxis type="category" dataKey="weight" tick={{ fontSize: 11 }} width={70} />
                    {/* <Tooltip formatter={(value: number) => fmt(value)} contentStyle={{ borderRadius: 8, fontSize: 12 }} /> */}
                    <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ fill: 'hsl(var(--muted) / 0.4)' }}
                    />
                    <Bar dataKey="buybackPrice" name="Harga Jual" fill="hsl(var(--primary) / 0.4)" radius={[0, 4, 4, 0]} label={{ position: "right", fontSize: 10, fill: "hsl(var(--muted-foreground))", formatter: (v: number) => v ? `Rp${(v / 1000).toLocaleString("id-ID")}.000` : '' }} />
                    <Bar dataKey="buyPrice" name="Harga Beli" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} label={{ position: "right", fontSize: 10, fill: "hsl(var(--foreground))", formatter: (v: number) => v ? fmt(v) : '' }} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

export default function Market() {
    const [liveData, setLiveData] = useState({
        antamList: [] as GoldPriceItem[],
        ubsList: [] as GoldPriceItem[],
        antam1g: 0, ubs1g: 0, antam1gBuyback: 0, ubs1gBuyback: 0,
    });
    const [history, setHistory] = useState<PriceHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { theme, toggleTheme } = useUser();

    useEffect(() => {
        async function loadMarket() {
            try {
                const [antam, ubs, dbHistory] = await Promise.all([fetchAntamPrices(), fetchUbsPrices(), getPriceHistory()]);

                const a1g = antam.find(p => p.weight.replace(/\s/g, '').toLowerCase() === '1gr');
                const u1g = ubs.find(p => p.weight.replace(/\s/g, '').toLowerCase() === '1gram');

                if (a1g && u1g) {
                    await saveTodayPrice({
                        antamBuy: a1g.buyPrice, antamBuyback: a1g.buybackPrice || 0,
                        ubsBuy: u1g.buyPrice, ubsBuyback: u1g.buybackPrice || 0
                    });
                }

                setLiveData({
                    antamList: antam, ubsList: ubs,
                    antam1g: a1g?.buyPrice || 0, antam1gBuyback: a1g?.buybackPrice || 0,
                    ubs1g: u1g?.buyPrice || 0, ubs1gBuyback: u1g?.buybackPrice || 0,
                });

                setHistory(await getPriceHistory());
            } catch (err) { }
            setLoading(false);
        }
        loadMarket();
    }, []);

    const prevData = history.length > 1 ? history[history.length - 2] : history[0];

    const date = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };

    const buyPctANTM = prevData?.antamBuy || 0 ? ((liveData.antam1g - prevData?.antamBuy || 0) / prevData?.antamBuy || 0) * 100 : 0;
    const buyPctUBS = prevData?.ubsBuy || 0 ? ((liveData.ubs1g - prevData?.ubsBuy || 0) / prevData?.ubsBuy || 0) * 100 : 0;

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b-2 border-foreground/10 bg-card sticky top-0 z-50">
                <div className="container max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                    <button onClick={() => navigate('/')} className="flex items-center gap-2 font-bold text-sm hover:text-primary transition-colors">
                        <ArrowLeft className="h-4 w-4" /> Back
                    </button>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleTheme}
                            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                            className="p-2.5 rounded-xl border-2 border-foreground/10 hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                        >
                            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        </button>
                    </div>
                </div>
            </header>

            <main className="container max-w-5xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
                    <div>
                        <p className="text-2xl font-extrabold leading-snug">
                            Market Harga Emas
                        </p>
                        <p className="text-sm text-muted-foreground">{date.toLocaleDateString('id-ID', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}</p>
                    </div>
                </div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    className="card-bordered rounded-2xl p-5 cursor-pointer hover:border-primary/40 transition-colors h-full flex flex-col"
                >
                    <div className="space-y-2.5 mt-auto">
                        <div className='flex justify-between items-start'>
                            <div className="flex flex-col justify-start text-xs font-semibold pt-1">
                                <span className="text-muted-foreground">Harga Beli ANTAM</span>
                                <span className="text-foreground">{liveData.antam1g}</span>
                                <span className={`${buyPctANTM >= 0 ? "text-success" : "text-destructive"} flex flex-row items-center`}>
                                    {buyPctANTM >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />} {buyPctANTM.toFixed(2)}%
                                </span>
                            </div>
                            <div className="flex flex-col justify-end text-end text-xs font-semibold pt-1">
                                <span className="text-muted-foreground">Harga Jual ANTAM</span>
                                <span className='text-foreground'>{liveData.antam1gBuyback}</span>
                            </div>
                        </div>
                        <div className='flex justify-between items-start'>
                            <div className="flex flex-col justify-start text-xs font-semibold pt-1">
                                <span className="text-muted-foreground">Harga Beli UBS</span>
                                <span className="text-destructive">{liveData.ubs1g}</span>
                                <span className={`${buyPctUBS >= 0 ? "text-success" : "text-destructive"} flex flex-row items-center`}>
                                    {buyPctUBS >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />} {buyPctUBS.toFixed(2)}%
                                </span>
                            </div>
                            <div className="flex flex-col justify-end text-end text-xs font-semibold pt-1">
                                <span className="text-muted-foreground">Harga Jual UBS</span>
                                <span className='text-foreground'>{liveData.ubs1gBuyback}</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                    <LiveScrapedTable title="Tabel ANTAM" data={liveData.antamList} hasBuyback={true} />
                    <LiveScrapedTable title="Tabel UBS" data={liveData.ubsList} hasBuyback={true} />
                </motion.div>

                <Tabs defaultValue="antam" className="space-y-4 pt-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.02 }}
                        className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg">Visualisasi Harga per Keping</h3>
                        <TabsList>
                            <TabsTrigger value="antam">ANTAM</TabsTrigger>
                            <TabsTrigger value="ubs">UBS</TabsTrigger>
                        </TabsList>
                    </motion.div>
                    <TabsContent value="antam">
                        <GramPriceChart data={liveData.antamList} title="Grafik Harga Emas ANTAM" />
                    </TabsContent>
                    <TabsContent value="ubs">
                        <GramPriceChart data={liveData.ubsList} title="Grafik Harga Emas UBS" />
                    </TabsContent>
                </Tabs>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    className="rounded-lg border bg-card p-4 mt-5">
                    <h3 className="font-semibold mb-4">Histori Pergerakan (30 Hari)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={history}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tickFormatter={(v) => format(parseISO(v), "dd MMM")} tick={{ fontSize: 10 }} />
                            <YAxis domain={["auto", "auto"]} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}jt`} tick={{ fontSize: 10 }} />
                            {/* <Tooltip formatter={(value: number) => formatRupiah(value)} /> */}
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Line type="monotone" dataKey="antamBuy" name="ANTAM Beli" stroke="#F59E0B" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="ubsBuy" name="UBS Beli" stroke="#3B82F6" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </motion.div>
            </main>
        </div>

    );
}