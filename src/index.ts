// =====================================================
// ТЕЛЕГРАМ БОТ ДЛЯ ВЫДАЧИ СКРИПТОВ
// Версия: 3.0.0
// Разработчик: @bananabonono (belxxx)
// =====================================================

import { Bot, filters } from 'workergram';

// =====================================================
// 1. КОНФИГУРАЦИЯ
// =====================================================
const CONFIG = {
    CHANNEL_USERNAME: "Belxxx",
    CHANNEL_LINK: "https://t.me/Belxxx",
    BOT_USERNAME: "belxxx_bot",
    VERSION: "1.0.0",
    DEVELOPER_ID: "@bananabonono",
    SUPPORT_CONTACT: "@bananabonono",
    GITHUB_RAW_URL: "https://raw.githubusercontent.com/belxxxdev/scripts/main/",
    INDEX_FILE: "index.json",
    ADMIN_ID: 6582678360,
};

// =====================================================
// 2. ЗАГРУЗКА СКРИПТОВ
// =====================================================
let cachedScripts: Record<string, string> = {};
let lastUpdateTime = 0;
const CACHE_TTL = 3600000;

async function loadScriptsFromGitHub(env: any): Promise<Record<string, string>> {
    const scripts: Record<string, string> = {};
    
    try {
        const indexUrl = `${CONFIG.GITHUB_RAW_URL}${CONFIG.INDEX_FILE}`;
        const response = await fetch(indexUrl);
        if (!response.ok) {
            return scripts;
        }
        
        const data = await response.json();
        const scriptList = data.scripts || [];
        
        for (const scriptName of scriptList) {
            try {
                const scriptUrl = `${CONFIG.GITHUB_RAW_URL}${scriptName}.lua`;
                const scriptResponse = await fetch(scriptUrl);
                if (scriptResponse.ok) {
                    scripts[scriptName] = await scriptResponse.text();
                }
            } catch (e) {
                console.log(`❌ Ошибка загрузки ${scriptName}.lua`);
            }
        }
        
        return scripts;
        
    } catch (error) {
        return scripts;
    }
}

async function getScripts(env: any): Promise<Record<string, string>> {
    const now = Date.now();
    if (now - lastUpdateTime > CACHE_TTL || Object.keys(cachedScripts).length === 0) {
        cachedScripts = await loadScriptsFromGitHub(env);
        lastUpdateTime = now;
    }
    return cachedScripts;
}

// =====================================================
// 3. ПРОВЕРКА ПОДПИСКИ
// =====================================================
async function isUserSubscribed(bot: Bot, userId: number, channelUsername: string): Promise<boolean> {
    try {
        const chat = await bot.api.getChat(`@${channelUsername}`);
        const member = await bot.api.getChatMember(chat.id, userId);
        return ['creator', 'administrator', 'member'].includes(member.status);
    } catch (error) {
        return false;
    }
}

// =====================================================
// 4. HTML
// =====================================================
const HTML_PAGE = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Belxxx Bot</title>
    <style>
        * { margin: 0; padding: 0; }
        body { background: #000000; height: 100vh; }
    </style>
</head>
<body>
</body>
</html>`;

// =====================================================
// 5. ГЛАВНЫЙ ОБРАБОТЧИК
// =====================================================
export default {
    async fetch(request: Request, env: any, ctx: any) {
        const bot = new Bot(env.TELEGRAM_BOT_TOKEN);
        const SCRIPTS = await getScripts(env);

        if (request.method === 'GET') {
            return new Response(HTML_PAGE, {
                headers: {
                    'Content-Type': 'text/html',
                    'Cache-Control': 'public, max-age=3600'
                }
            });
        }

        if (request.method !== 'POST') {
            return new Response('Method not allowed', { status: 405 });
        }

        // ==========================================
        // /START
        // ==========================================
        bot.onCommand('start', async (ctx) => {
            const userId = ctx.from.id;
            const args = ctx.message.text?.split(' ')[1] || '';
            
            if (args && SCRIPTS[args]) {
                const isSubscribed = await isUserSubscribed(bot, userId, CONFIG.CHANNEL_USERNAME);
                
                if (isSubscribed) {
                    await ctx.reply(
                        `✅ Вот твой скрипт! / Here is your script!\n\n\`\`\`lua\n${SCRIPTS[args]}\n\`\`\`\n\n📋 Нажми на текст, чтобы скопировать его. / Click on the text to copy it.`,
                        { parse_mode: 'MarkdownV2' }
                    );
                } else {
                    await ctx.reply(
                        `🇷🇺: Чтобы получить скрипт, подпишись на наш канал!\n` +
                        `🇺🇸: To get the script, subscribe to our channel!\n\n` +
                        `📌 Скрипт / Script: ${args}.lua\n\n` +
                        `👇 Подпишись и нажми "Перепроверить" / Subscribe and click "Check again".`,
                        {
                            reply_markup: {
                                inline_keyboard: [
                                    [{ text: '📢 Подписаться / Subscribe', url: CONFIG.CHANNEL_LINK }],
                                    [{ text: '🔄 Перепроверить / Check again', callback_data: `check_${args}` }]
                                ]
                            }
                        }
                    );
                }
                return;
            }
            
            // ПРИВЕТСТВИЕ
            await ctx.reply(
                `🇷🇺: Добро пожаловать в Belxxx_bot - бота для выдачи скриптов с минимальными требованиями!\n` +
                `🇺🇸: Welcome to Belxxx_bot - a script delivery bot with minimal requirements!\n\n` +
                `😌 Версия / Version: ${CONFIG.VERSION}\n` +
                `❤️ Мой канал / My channel: @${CONFIG.CHANNEL_USERNAME}`
            );
        });

        // ==========================================
        // /HELP
        // ==========================================
        bot.onCommand('help', async (ctx) => {
            await ctx.reply(
                `🇷🇺: По вопросам пишите ${CONFIG.SUPPORT_CONTACT}\n` +
                `🇺🇸: For questions, write to ${CONFIG.SUPPORT_CONTACT}`
            );
        });

        // ==========================================
        // /INFO
        // ==========================================
        bot.onCommand('info', async (ctx) => {
            await ctx.reply(
                `🤖 BelxxxScripts\n` +
                `🇷🇺: Версия / 🇺🇸: Version: ${CONFIG.VERSION}\n` +
                `🇷🇺: Разработчик / 🇺🇸: Developer: ${CONFIG.DEVELOPER_ID}\n` +
                `🇷🇺: Канал / 🇺🇸: Channel: @${CONFIG.CHANNEL_USERNAME}\n` +
                `🇷🇺: Статус / 🇺🇸: Status: ✅ Работает / Working\n\n` +
                `📦 🇷🇺: Скриптов / 🇺🇸: Scripts: ${Object.keys(SCRIPTS).length}\n\n` +
                `🇷🇺: По вопросам пишите / 🇺🇸: For questions, write to: ${CONFIG.SUPPORT_CONTACT}`
            );
        });

        // ==========================================
        // /SCRIPTS
        // ==========================================
        bot.onCommand('scripts', async (ctx) => {
            const scriptList = Object.keys(SCRIPTS).map((name) => 
                `${name}.lua\n   🔗 https://t.me/${CONFIG.BOT_USERNAME}?start=${name}`
            ).join('\n\n');
            
            await ctx.reply(
                `📚 🇷🇺: Все скрипты / 🇺🇸: All scripts:\n\n${scriptList}\n\n` +
                `🇷🇺: По вопросам пишите / 🇺🇸: For questions, write to: ${CONFIG.SUPPORT_CONTACT}`
            );
        });

        // ==========================================
        // /UPDATE
        // ==========================================
        bot.onCommand('update', async (ctx) => {
            const userId = ctx.from.id;
            
            if (userId !== CONFIG.ADMIN_ID) {
                await ctx.reply(
                    `🇷🇺: У тебя нет прав.\n` +
                    `🇺🇸: You don't have permission.`
                );
                return;
            }
            
            await ctx.reply(
                `🔄 🇷🇺: Обновляю скрипты... / 🇺🇸: Updating scripts...`
            );
            cachedScripts = await loadScriptsFromGitHub(env);
            lastUpdateTime = Date.now();
            
            await ctx.reply(
                `✅ 🇷🇺: Скрипты обновлены! / 🇺🇸: Scripts updated!\n` +
                `📦 🇷🇺: Загружено / 🇺🇸: Loaded: ${Object.keys(cachedScripts).length}`
            );
        });

        // ==========================================
        // КНОПКА "ПЕРЕПРОВЕРИТЬ"
        // ==========================================
        bot.onCallbackQuery(filters.callbackData(/check_.+/), async (ctx) => {
            const scriptName = ctx.callbackQuery.data.replace('check_', '');
            const userId = ctx.from.id;
            
            const isSubscribed = await isUserSubscribed(bot, userId, CONFIG.CHANNEL_USERNAME);
            
            if (isSubscribed) {
                if (SCRIPTS[scriptName]) {
                    await ctx.editMessageText(
                        `✅ 🇷🇺: Подписка подтверждена! / 🇺🇸: Subscription confirmed!\n\n` +
                        `📌 🇷🇺: Скрипт / 🇺🇸: Script: ${scriptName}.lua\n\n` +
                        `\`\`\`lua\n${SCRIPTS[scriptName]}\n\`\`\``,
                        { parse_mode: 'MarkdownV2' }
                    );
                    await ctx.answerCallbackQuery(
                        `🇷🇺: Скрипт получен! / 🇺🇸: Script received!`
                    );
                }
            } else {
                await ctx.answerCallbackQuery(
                    `🇷🇺: Ты ещё не подписался! / 🇺🇸: You haven't subscribed yet!`,
                    { show_alert: true }
                );
            }
        });

        // ==========================================
        // ТЕКСТОВЫЕ СООБЩЕНИЯ
        // ==========================================
        bot.onMessage(async (ctx) => {
            const text = ctx.message.text || '';
            const userId = ctx.from.id;
            
            if (text.startsWith('/')) return;
            
            const scriptName = text.trim().toLowerCase();
            
            if (SCRIPTS[scriptName]) {
                const isSubscribed = await isUserSubscribed(bot, userId, CONFIG.CHANNEL_USERNAME);
                
                if (isSubscribed) {
                    await ctx.reply(
                        `✅ Вот твой скрипт! / Here is your script!\n\n\`\`\`lua\n${SCRIPTS[scriptName]}\n\`\`\`\n\n📋 Нажми на текст, чтобы скопировать его. / Click on the text to copy it.`,
                        { parse_mode: 'MarkdownV2' }
                    );
                } else {
                    await ctx.reply(
                        `🇷🇺: Чтобы получить скрипт, подпишись на канал!\n` +
                        `🇺🇸: To get the script, subscribe to the channel!\n\n` +
                        `📌 Скрипт / Script: ${scriptName}.lua`,
                        {
                            reply_markup: {
                                inline_keyboard: [
                                    [{ text: '📢 Подписаться / Subscribe', url: CONFIG.CHANNEL_LINK }],
                                    [{ text: '🔄 Перепроверить / Check again', callback_data: `check_${scriptName}` }]
                                ]
                            }
                        }
                    );
                }
            } else {
                const scriptList = Object.keys(SCRIPTS).map((name) => `• ${name}.lua`).join('\n');
                await ctx.reply(
                    `❌ 🇷🇺: Скрипт "${text}" не найден. / 🇺🇸: Script "${text}" not found.\n\n` +
                    `📚 🇷🇺: Доступные скрипты / 🇺🇸: Available scripts:\n${scriptList}\n\n` +
                    `🇷🇺: По вопросам пишите / 🇺🇸: For questions, write to: ${CONFIG.SUPPORT_CONTACT}`
                );
            }
        });

        // ==========================================
        // ВЕБХУК
        // ==========================================
        try {
            const update = await request.json();
            await bot.processUpdate(update);
            return new Response('OK', { status: 200 });
        } catch (error) {
            return new Response('Error', { status: 500 });
        }
    }
};
