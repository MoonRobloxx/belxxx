// =====================================================
// БОТ ДЛЯ ВЫДАЧИ СКРИПТОВ (LUA)
// Проверка подписки по username канала
// Версия: 2.0.0
// Разработчик: @bananabonono (belxxx)
// =====================================================

import { Bot, filters } from 'workergram';

// =====================================================
// 1. КОНФИГУРАЦИЯ (из переменных окружения)
// =====================================================
const CONFIG = {
    CHANNEL_USERNAME: "belxxx", // Username канала (без @)
    CHANNEL_LINK: "https://t.me/belxxx",
    BOT_USERNAME: "BelxxxScriptsBot",
    VERSION: "2.0.0",
    DEVELOPER_ID: "bananabonono",
    SUPPORT_CONTACT: "@bananabonono",
};

// =====================================================
// 2. СПИСОК СКРИПТОВ (можно расширять)
// =====================================================
const SCRIPTS: Record<string, string> = {
    "example": `print("Hello from LUA!")\n-- Твой скрипт здесь`,
    "bypass": `-- Скрипт для обхода\nprint("Bypass работает!")`,
    "custom": `-- Кастомный скрипт\nprint("Custom script!")`,
};

// =====================================================
// 3. ФУНКЦИЯ ПРОВЕРКИ ПОДПИСКИ
// =====================================================
async function isUserSubscribed(bot: Bot, userId: number, channelUsername: string): Promise<boolean> {
    try {
        // Получаем ID канала по username
        const chat = await bot.api.getChat(`@${channelUsername}`);
        const channelId = chat.id;
        
        // Проверяем статус пользователя
        const member = await bot.api.getChatMember(channelId, userId);
        return ['creator', 'administrator', 'member'].includes(member.status);
    } catch (error) {
        console.error('Ошибка проверки подписки:', error);
        return false;
    }
}

// =====================================================
// 4. ФУНКЦИЯ ГЕНЕРАЦИИ КНОПОК
// =====================================================
function getSubscribeKeyboard() {
    return {
        inline_keyboard: [
            [{ text: '📢 Подписаться на канал', url: CONFIG.CHANNEL_LINK }],
            [{ text: '🔄 Проверить подписку', callback_data: 'check_sub' }]
        ]
    };
}

function getScriptButtons() {
    const buttons = Object.keys(SCRIPTS).map(name => [
        { text: `📜 ${name}.lua`, url: `https://t.me/${CONFIG.BOT_USERNAME}?start=${name}` }
    ]);
    return { inline_keyboard: buttons };
}

// =====================================================
// 5. ГЛАВНЫЙ ОБРАБОТЧИК
// =====================================================
export default {
    async fetch(request: Request, env: any, ctx: any) {
        // Инициализация бота
        const bot = new Bot(env.TELEGRAM_BOT_TOKEN || "ТВОЙ_ТОКЕН");

        // ==========================================
        // 5.1. КОМАНДА /START
        // ==========================================
        bot.onCommand('start', async (ctx) => {
            const userId = ctx.from.id;
            const args = ctx.message.text?.split(' ')[1] || '';
            
            // Проверяем подписку
            const isSubscribed = await isUserSubscribed(bot, userId, CONFIG.CHANNEL_USERNAME);

            if (!isSubscribed) {
                // Не подписан
                await ctx.reply(
                    `❌ Чтобы получить скрипт, подпишись на наш канал!\n\n` +
                    `👇 Нажми на кнопку ниже, подпишись, а потом нажми "Проверить подписку".`,
                    { reply_markup: getSubscribeKeyboard() }
                );
                return;
            }

            // Подписан
            if (args && SCRIPTS[args]) {
                // Выдаём конкретный скрипт
                await ctx.reply(
                    `✅ Вот твой скрипт!\n\n\`\`\`lua\n${SCRIPTS[args]}\n\`\`\`\n\n📋 Нажми на текст, чтобы скопировать его.`,
                    { parse_mode: 'MarkdownV2' }
                );
            } else {
                // Показываем список скриптов
                const scriptList = Object.keys(SCRIPTS).map((name, i) => 
                    `${i+1}. ${name}.lua`
                ).join('\n');
                
                await ctx.reply(
                    `👋 Привет! Я выдаю LUA-скрипты.\n\n` +
                    `📚 Доступные скрипты:\n${scriptList}\n\n` +
                    `👇 Нажми на кнопку под скриптом в канале, чтобы получить его.`,
                    { reply_markup: getScriptButtons() }
                );
            }
        });

        // ==========================================
        // 5.2. КОМАНДА /HELP
        // ==========================================
        bot.onCommand('help', async (ctx) => {
            const scriptList = Object.keys(SCRIPTS).map((name, i) => 
                `${i+1}. ${name}.lua`
            ).join('\n');
            
            await ctx.reply(
                `🇷🇺/🇺🇸 По вопросам пишите ${CONFIG.SUPPORT_CONTACT} / For questions, write to ${CONFIG.SUPPORT_CONTACT}\n\n` +
                `📚 Доступные команды:\n` +
                `/start - Приветствие / Welcome\n` +
                `/help - Помощь / Help\n` +
                `/info - Информация / Info\n` +
                `/scripts - Список скриптов\n\n` +
                `📦 Доступные скрипты:\n${scriptList}\n\n` +
                `❓ При баге или за помощью пишите: ${CONFIG.SUPPORT_CONTACT}`
            );
        });

        // ==========================================
        // 5.3. КОМАНДА /INFO
        // ==========================================
        bot.onCommand('info', async (ctx) => {
            await ctx.reply(
                `🤖 BelxxxScripts (LUA)\n` +
                `Версия / Version: ${CONFIG.VERSION}\n` +
                `Разработчик / Developer: @${CONFIG.DEVELOPER_ID}\n` +
                `Канал / Channel: @${CONFIG.CHANNEL_USERNAME}\n` +
                `Статус / Status: ✅ Работает\n\n` +
                `📦 Скриптов в базе: ${Object.keys(SCRIPTS).length}\n\n` +
                `❓ При баге или за помощью пишите: ${CONFIG.SUPPORT_CONTACT}\n\n` +
                `🇷🇺/🇺🇸 Этот бот создан @${CONFIG.DEVELOPER_ID} / This bot was created by @${CONFIG.DEVELOPER_ID}`
            );
        });

        // ==========================================
        // 5.4. КОМАНДА /SCRIPTS - список всех скриптов
        // ==========================================
        bot.onCommand('scripts', async (ctx) => {
            const scriptList = Object.keys(SCRIPTS).map((name) => 
                `${name}.lua\n   🔗 https://t.me/${CONFIG.BOT_USERNAME}?start=${name}`
            ).join('\n\n');
            
            await ctx.reply(
                `📚 Все доступные скрипты:\n\n${scriptList}\n\n` +
                `👇 Нажми на ссылку, чтобы получить скрипт.`
            );
        });

        // ==========================================
        // 5.5. ПРОВЕРКА ПОДПИСКИ (кнопка)
        // ==========================================
        bot.onCallbackQuery(filters.callbackData('check_sub'), async (ctx) => {
            const userId = ctx.from.id;
            
            const isSubscribed = await isUserSubscribed(bot, userId, CONFIG.CHANNEL_USERNAME);

            if (isSubscribed) {
                await ctx.editMessageText(
                    '✅ Подписка подтверждена! Теперь нажми на кнопку скрипта в канале.'
                );
                await ctx.answerCallbackQuery();
            } else {
                await ctx.answerCallbackQuery(
                    '❌ Ты еще не подписан! Подпишись и нажми "Проверить" снова.',
                    { show_alert: true }
                );
            }
        });

        // ==========================================
        // 5.6. ОБРАБОТЧИК ТЕКСТОВЫХ СООБЩЕНИЙ
        // ==========================================
        bot.onMessage(async (ctx) => {
            const text = ctx.message.text || '';
            
            // Игнорируем команды
            if (text.startsWith('/')) return;
            
            await ctx.reply(
                `🤔 Я не понимаю это сообщение.\n\n` +
                `📚 Используй команды:\n` +
                `/start - Приветствие\n` +
                `/help - Помощь\n` +
                `/info - Информация\n` +
                `/scripts - Список скриптов\n\n` +
                `❓ При баге или за помощью пишите: ${CONFIG.SUPPORT_CONTACT}`
            );
        });

        // ==========================================
        // 5.7. ОБРАБОТКА ВЕБХУКА (POST-запросы)
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
        // 5.8. GET-ЗАПРОСЫ (информация)
        // ==========================================
        return new Response(
            `🤖 BelxxxScripts Bot (LUA)\n` +
            `Версия: ${CONFIG.VERSION}\n` +
            `Статус: ✅ Работает\n` +
            `Скриптов: ${Object.keys(SCRIPTS).length}\n` +
            `Канал: @${CONFIG.CHANNEL_USERNAME}\n\n` +
            `📁 Папка: /scripts/\n` +
            `📄 Формат: .lua\n\n` +
            `Для работы используй POST-запросы от Telegram.`,
            { status: 200 }
        );
    }
};
