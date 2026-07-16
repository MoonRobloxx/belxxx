// =====================================================
// БОТ ДЛЯ ВЫДАЧИ СКРИПТОВ ИЗ GITHUB
// Пользователь пишет название скрипта → бот проверяет подписку
// Версия: 3.0.0
// Разработчик: @bananabonono (belxxx)
// =====================================================

import { Bot, filters } from 'workergram';

// =====================================================
// 1. КОНФИГУРАЦИЯ (ЗАМЕНИ НА СВОИ ЗНАЧЕНИЯ!)
// =====================================================
const CONFIG = {
    // ---- НАСТРОЙКИ КАНАЛА ----
    CHANNEL_USERNAME: "Belxxx",          // ← ТВОЙ КАНАЛ (без @)
    CHANNEL_LINK: "https://t.me/Belxxx", // ← ССЫЛКА НА КАНАЛ
    
    // ---- НАСТРОЙКИ БОТА ----
    BOT_USERNAME: "belxxx_bot",    // ← ИМЯ БОТА (без @)
    VERSION: "3.0.0",
    DEVELOPER_ID: "@bananabonono",        // ← ТВОЙ ЮЗЕРНЕЙМ
    SUPPORT_CONTACT: "@bananabonono",    // ← ТВОЙ КОНТАКТ
    
    // ---- НАСТРОЙКИ GITHUB ----
    GITHUB_RAW_URL: "https://raw.githubusercontent.com/belxxxdev/scripts/main/",
    INDEX_FILE: "index.json",
};

// =====================================================
// 2. ЗАГРУЗКА СКРИПТОВ ИЗ GITHUB
// =====================================================
let cachedScripts: Record<string, string> = {};
let lastUpdateTime = 0;
const CACHE_TTL = 300000; // 5 минут

async function loadScriptsFromGitHub(env: any): Promise<Record<string, string>> {
    const scripts: Record<string, string> = {};
    
    try {
        const indexUrl = `${CONFIG.GITHUB_RAW_URL}${CONFIG.INDEX_FILE}`;
        console.log(`📥 Загрузка списка скриптов: ${indexUrl}`);
        
        const response = await fetch(indexUrl);
        if (!response.ok) {
            console.error(`❌ Не удалось загрузить index.json: ${response.status}`);
            return getDefaultScripts();
        }
        
        const data = await response.json();
        const scriptList = data.scripts || [];
        
        console.log(`📋 Найдено скриптов: ${scriptList.length}`);
        
        for (const scriptName of scriptList) {
            try {
                const scriptUrl = `${CONFIG.GITHUB_RAW_URL}${scriptName}.lua`;
                console.log(`📥 Загрузка: ${scriptName}.lua`);
                
                const scriptResponse = await fetch(scriptUrl);
                if (scriptResponse.ok) {
                    scripts[scriptName] = await scriptResponse.text();
                    console.log(`✅ Загружен: ${scriptName}.lua`);
                } else {
                    console.log(`❌ Не найден: ${scriptName}.lua`);
                }
            } catch (e) {
                console.log(`❌ Ошибка загрузки ${scriptName}.lua:`, e);
            }
        }
        
        return scripts;
        
    } catch (error) {
        console.error('❌ Ошибка загрузки скриптов из GitHub:', error);
        return getDefaultScripts();
    }
}

function getDefaultScripts(): Record<string, string> {
    return {
        "example": `print("Hello from LUA!")\n-- Пример скрипта`,
        "bypass": `-- Скрипт для обхода\nprint("Bypass works!")`,
    };
}

async function getScripts(env: any): Promise<Record<string, string>> {
    const now = Date.now();
    if (now - lastUpdateTime > CACHE_TTL || Object.keys(cachedScripts).length === 0) {
        console.log('🔄 Обновление кэша скриптов...');
        cachedScripts = await loadScriptsFromGitHub(env);
        lastUpdateTime = now;
        console.log(`✅ Кэш обновлён: ${Object.keys(cachedScripts).length} скриптов`);
    }
    return cachedScripts;
}

// =====================================================
// 3. ФУНКЦИЯ ПРОВЕРКИ ПОДПИСКИ
// =====================================================
async function isUserSubscribed(bot: Bot, userId: number, channelUsername: string): Promise<boolean> {
    try {
        const chat = await bot.api.getChat(`@${channelUsername}`);
        const member = await bot.api.getChatMember(chat.id, userId);
        return ['creator', 'administrator', 'member'].includes(member.status);
    } catch (error) {
        console.error('Ошибка проверки подписки:', error);
        return false;
    }
}

// =====================================================
// 4. ГЛАВНЫЙ ОБРАБОТЧИК
// =====================================================
export default {
    async fetch(request: Request, env: any, ctx: any) {
        const bot = new Bot(env.TELEGRAM_BOT_TOKEN);
        const SCRIPTS = await getScripts(env);

        // ==========================================
        // 4.1. КОМАНДА /START
        // ==========================================
        bot.onCommand('start', async (ctx) => {
            const userId = ctx.from.id;
            const args = ctx.message.text?.split(' ')[1] || '';
            
            // Если есть параметр (например, /start roblox)
            if (args && SCRIPTS[args]) {
                // Проверяем подписку
                const isSubscribed = await isUserSubscribed(bot, userId, CONFIG.CHANNEL_USERNAME);
                
                if (isSubscribed) {
                    // Подписан → выдаём скрипт
                    await ctx.reply(
                        `✅ Вот твой скрипт!\n\n\`\`\`lua\n${SCRIPTS[args]}\n\`\`\`\n\n📋 Нажми на текст, чтобы скопировать его.`,
                        { parse_mode: 'MarkdownV2' }
                    );
                } else {
                    // Не подписан → просим подписаться
                    await ctx.reply(
                        `❌ Чтобы получить скрипт, подпишись на наш канал!\n\n` +
                        `📌 Скрипт: ${args}.lua\n\n` +
                        `👇 Подпишись и нажми "Перепроверить".`,
                        {
                            reply_markup: {
                                inline_keyboard: [
                                    [{ text: '📢 Подписаться на канал', url: CONFIG.CHANNEL_LINK }],
                                    [{ text: '🔄 Перепроверить', callback_data: `check_${args}` }]
                                ]
                            }
                        }
                    );
                }
            } else {
                // Обычный /start без параметра → показываем список скриптов
                const scriptList = Object.keys(SCRIPTS).map((name, i) => 
                    `${i+1}. ${name}.lua`
                ).join('\n');
                
                await ctx.reply(
                    `👋 Привет! Я выдаю LUA-скрипты.\n\n` +
                    `📚 Чтобы получить скрипт, просто напиши его название.\n` +
                    `📦 Доступные скрипты:\n${scriptList}\n\n` +
                    `📌 Пример: напиши "roblox" и я выдам скрипт.\n\n` +
                    `❓ Вопросы: ${CONFIG.SUPPORT_CONTACT}`
                );
            }
        });

        // ==========================================
        // 4.2. КОМАНДА /HELP
        // ==========================================
        bot.onCommand('help', async (ctx) => {
            await ctx.reply(
                `🇷🇺/🇺🇸 По вопросам пишите ${CONFIG.SUPPORT_CONTACT}\n\n` +
                `📚 Доступные команды:\n` +
                `/start - Показать список скриптов\n` +
                `/help - Помощь\n` +
                `/info - Информация о боте\n` +
                `/scripts - Все скрипты со ссылками\n` +
                `/update - Обновить скрипты из GitHub (админ)\n\n` +
                `📌 Чтобы получить скрипт, просто напиши его название.\n` +
                `Например: "roblox" или "bypass"\n\n` +
                `❓ Вопросы: ${CONFIG.SUPPORT_CONTACT}`
            );
        });

        // ==========================================
        // 4.3. КОМАНДА /INFO
        // ==========================================
        bot.onCommand('info', async (ctx) => {
            await ctx.reply(
                `🤖 BelxxxScripts (LUA)\n` +
                `Версия / Version: ${CONFIG.VERSION}\n` +
                `Разработчик / Developer: @${CONFIG.DEVELOPER_ID}\n` +
                `Канал / Channel: @${CONFIG.CHANNEL_USERNAME}\n` +
                `Статус / Status: ✅ Работает\n\n` +
                `📦 Скриптов в базе: ${Object.keys(SCRIPTS).length}\n` +
                `📁 Источник: GitHub\n` +
                `📄 Формат: .lua\n\n` +
                `❓ Вопросы: ${CONFIG.SUPPORT_CONTACT}`
            );
        });

        // ==========================================
        // 4.4. КОМАНДА /SCRIPTS - список всех скриптов
        // ==========================================
        bot.onCommand('scripts', async (ctx) => {
            const scriptList = Object.keys(SCRIPTS).map((name) => 
                `${name}.lua\n   🔗 https://t.me/${CONFIG.BOT_USERNAME}?start=${name}`
            ).join('\n\n');
            
            await ctx.reply(
                `📚 Все доступные скрипты:\n\n${scriptList}\n\n` +
                `📌 Напиши название скрипта, чтобы получить его.\n` +
                `Например: "roblox"`
            );
        });

        // ==========================================
        // 4.5. КОМАНДА /UPDATE - обновить скрипты
        // ==========================================
        bot.onCommand('update', async (ctx) => {
            const userId = ctx.from.id;
            const ADMIN_ID = 6582678360; // ЗАМЕНИ НА СВОЙ ID!
            
            if (userId !== ADMIN_ID) {
                await ctx.reply('❌ У тебя нет прав на обновление скриптов.');
                return;
            }
            
            await ctx.reply('🔄 Обновляю скрипты из GitHub...');
            cachedScripts = await loadScriptsFromGitHub(env);
            lastUpdateTime = Date.now();
            
            await ctx.reply(
                `✅ Скрипты обновлены!\n` +
                `📦 Загружено скриптов: ${Object.keys(cachedScripts).length}`
            );
        });

        // ==========================================
        // 4.6. ОБРАБОТЧИК КНОПКИ "ПЕРЕПРОВЕРИТЬ"
        // ==========================================
        bot.onCallbackQuery(async (ctx) => {
            const data = ctx.callbackQuery.data || '';
            
            // Проверяем, что это кнопка "Перепроверить" (check_имя_скрипта)
            if (data.startsWith('check_')) {
                const scriptName = data.replace('check_', '');
                const userId = ctx.from.id;
                
                // Проверяем подписку
                const isSubscribed = await isUserSubscribed(bot, userId, CONFIG.CHANNEL_USERNAME);
                
                if (isSubscribed) {
                    // Подписался → выдаём скрипт
                    if (SCRIPTS[scriptName]) {
                        await ctx.editMessageText(
                            `✅ Подписка подтверждена!\n\n` +
                            `📌 Скрипт: ${scriptName}.lua\n\n` +
                            `\`\`\`lua\n${SCRIPTS[scriptName]}\n\`\`\``,
                            { parse_mode: 'MarkdownV2' }
                        );
                        await ctx.answerCallbackQuery('✅ Скрипт получен!');
                    } else {
                        await ctx.editMessageText(
                            `❌ Скрипт "${scriptName}" не найден.`
                        );
                        await ctx.answerCallbackQuery();
                    }
                } else {
                    // Всё ещё не подписан
                    await ctx.answerCallbackQuery(
                        '❌ Ты ещё не подписался на канал! Подпишись и нажми "Перепроверить" снова.',
                        { show_alert: true }
                    );
                }
            }
        });

        // ==========================================
        // 4.7. ОБРАБОТЧИК ТЕКСТОВЫХ СООБЩЕНИЙ (названия скриптов)
        // ==========================================
        bot.onMessage(async (ctx) => {
            const text = ctx.message.text || '';
            const userId = ctx.from.id;
            
            // Игнорируем команды (они уже обработаны выше)
            if (text.startsWith('/')) {
                return;
            }
            
            // Проверяем, есть ли такой скрипт
            const scriptName = text.trim().toLowerCase();
            
            if (SCRIPTS[scriptName]) {
                // Скрипт найден → проверяем подписку
                const isSubscribed = await isUserSubscribed(bot, userId, CONFIG.CHANNEL_USERNAME);
                
                if (isSubscribed) {
                    // Подписан → выдаём скрипт
                    await ctx.reply(
                        `✅ Вот твой скрипт!\n\n\`\`\`lua\n${SCRIPTS[scriptName]}\n\`\`\`\n\n📋 Нажми на текст, чтобы скопировать его.`,
                        { parse_mode: 'MarkdownV2' }
                    );
                } else {
                    // Не подписан → просим подписаться
                    await ctx.reply(
                        `❌ Чтобы получить скрипт, подпишись на наш канал!\n\n` +
                        `📌 Скрипт: ${scriptName}.lua\n\n` +
                        `👇 Подпишись и нажми "Перепроверить".`,
                        {
                            reply_markup: {
                                inline_keyboard: [
                                    [{ text: '📢 Подписаться на канал', url: CONFIG.CHANNEL_LINK }],
                                    [{ text: '🔄 Перепроверить', callback_data: `check_${scriptName}` }]
                                ]
                            }
                        }
                    );
                }
            } else {
                // Скрипт не найден
                const scriptList = Object.keys(SCRIPTS).map((name) => 
                    `• ${name}.lua`
                ).join('\n');
                
                await ctx.reply(
                    `❌ Скрипт "${text}" не найден.\n\n` +
                    `📚 Доступные скрипты:\n${scriptList}\n\n` +
                    `📌 Напиши название скрипта, чтобы получить его.\n` +
                    `Например: "example" или "bypass"`
                );
            }
        });

        // ==========================================
        // 4.8. ОБРАБОТКА ВЕБХУКА (POST-запросы)
        // ==========================================
        if (request.method === 'POST') {
            try {
                const update = await request.json();
                await bot.processUpdate(update);
                return new Response('OK', { status: 200 });
            } catch (error) {
                console.error('Ошибка обработки вебхука:', error);
                return new Response('Error', { status: 500 });
            }
        }

        // ==========================================
        // 4.9. GET-ЗАПРОСЫ (информация)
        // ==========================================
        return new Response(
            `🤖 Belxxx Bot (GitHub)\n` +
            `Версия: ${CONFIG.VERSION}\n` +
            `Статус: ✅ Работает\n` +
            `Скриптов: ${Object.keys(SCRIPTS).length}\n` +
            `Канал: @${CONFIG.CHANNEL_USERNAME}\n\n` +
            `📁 Источник: GitHub\n` +
            `📄 Формат: .lua\n\n` +
            `📌 Напиши название скрипта, чтобы получить его.\n\n` +
            `Для работы используй POST-запросы от Telegram.`,
            { status: 200 }
        );
    }
};
