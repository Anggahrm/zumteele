const moment = require('moment-timezone');
const { Markup } = require('telegraf');
const logger = require('../utils/logger');

class ScheduleHandler {
  static schedule = [
    { No: 1, Kode: 'INF2133', Nama: 'Fisika: Optis dan Gelombang', Kelas: '12D', SKS: 2, Kampus: 'Kampus Gejayan', Waktu: 'Jumat, 15:21 - 17:00', Ruang: 'D-309-310' },
    { No: 2, Kode: 'INF2134', Nama: 'Kalkulus', Kelas: '12D', SKS: 3, Kampus: 'Kampus Gejayan', Waktu: 'Rabu, 07:01 - 09:30', Ruang: 'D-306-308' },
    { No: 3, Kode: 'INF2132P', Nama: 'Praktikum Algoritma & Pemrograman', Kelas: '12D1', SKS: 1, Kampus: 'Kampus Gejayan', Waktu: 'Senin, 15:21 - 17:00', Ruang: 'D-LAB1' },
    { No: 4, Kode: 'INF2132', Nama: 'Algoritma & Pemrograman', Kelas: '12D', SKS: 2, Kampus: 'Kampus Gejayan', Waktu: 'Selasa, 12:01 - 14:30', Ruang: 'D-306-308' },
    { No: 5, Kode: 'INF2131', Nama: 'Konsep Sistem Informasi', Kelas: '12D', SKS: 2, Kampus: 'Kampus Gejayan', Waktu: 'Selasa, 09:31 - 11:10', Ruang: 'D-304-305' },
    { No: 6, Kode: 'FTI2120', Nama: 'Etika', Kelas: '12D', SKS: 2, Kampus: 'Kampus Gejayan', Waktu: 'Rabu, 12:01 - 14:30', Ruang: 'D-309-310' },
    { No: 7, Kode: 'INF2130', Nama: 'Pengantar Informatika', Kelas: '12D', SKS: 2, Kampus: 'Kampus Gejayan', Waktu: 'Selasa, 07:51 - 09:30', Ruang: 'D-306-308' },
    { No: 8, Kode: 'MBY01', Nama: 'Pendidikan Agama Islam', Kelas: '12D', SKS: 2, Kampus: 'Kampus Gejayan', Waktu: 'Kamis, 09:31 - 11:10', Ruang: 'D-FullEL TI a' },
    { No: 9, Kode: 'MBY07', Nama: 'Pancasila', Kelas: '12D', SKS: 2, Kampus: 'Kampus Gejayan', Waktu: 'Kamis, 11:11 - 12:50', Ruang: 'D-FullEL TI a' }
  ];

  static days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  static async showSchedule(ctx) {
    try {
      const today = this.days[moment().tz('Asia/Jakarta').day()];
      const todaySchedule = this.getScheduleForDay(today);

      const message = this.formatScheduleMessage(today, todaySchedule);
      const keyboard = this.buildScheduleKeyboard(today);

      await ctx.reply(message, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(keyboard)
      });
    } catch (error) {
      logger.error('Schedule handler error:', error);
      await ctx.reply('❌ An error occurred while fetching the schedule.', {
        reply_markup: Markup.keyboard([
          ['🎵 Spotify', '🤖 AI Settings'],
          ['📅 Schedule', '👤 User Info'],
          ['⚙️ Settings']
        ]).resize()
      });
    }
  }

  static getScheduleForDay(day) {
    return this.schedule.filter(item => item.Waktu.startsWith(day))
      .sort((a, b) => {
        const timeA = this.extractTime(a.Waktu);
        const timeB = this.extractTime(b.Waktu);
        return timeA.localeCompare(timeB);
      });
  }

  static extractTime(waktu) {
    const match = waktu.match(/\d{2}:\d{2}/);
    return match ? match[0] : '00:00';
  }

  static formatScheduleMessage(day, schedule) {
    const header = `📅 *Jadwal Kuliah - ${day}*\n\n`;
    
    if (schedule.length === 0) {
      return header + '✨ Tidak ada jadwal kuliah hari ini.';
    }

    const totalSKS = schedule.reduce((sum, item) => sum + item.SKS, 0);
    const scheduleDetails = schedule.map(item => 
      `🎓 *${item.Nama}*\n` +
      `📝 Kode: \`${item.Kode}\`\n` +
      `👥 Kelas: ${item.Kelas}\n` +
      `⏰ Waktu: ${item.Waktu.split(', ')[1]}\n` +
      `🏛 Ruang: ${item.Ruang}\n` +
      `📚 SKS: ${item.SKS}`
    ).join('\n\n');

    return `${header}${scheduleDetails}\n\n📊 Total SKS hari ini: ${totalSKS}`;
  }

  static buildScheduleKeyboard(currentDay) {
    const keyboard = [];
    const row1 = [];
    const row2 = [];

    this.days.forEach((day, index) => {
      const button = Markup.button.callback(
        day === currentDay ? `• ${day} •` : day,
        `schedule_${day}`
      );
      if (index < 4) {
        row1.push(button);
      } else {
        row2.push(button);
      }
    });

    keyboard.push(row1);
    keyboard.push(row2);

    // Add summary buttons
    keyboard.push([
      Markup.button.callback('📊 Ringkasan Mingguan', 'schedule_weekly'),
      Markup.button.callback('📋 Total SKS', 'schedule_sks')
    ]);

    return keyboard;
  }

  static async handleCallback(ctx) {
    try {
      const data = ctx.callbackQuery.data;
      const action = data.replace('schedule_', '');

      if (action === 'weekly') {
        await this.showWeeklySummary(ctx);
      } else if (action === 'sks') {
        await this.showSKSSummary(ctx);
      } else {
        const schedule = this.getScheduleForDay(action);
        const message = this.formatScheduleMessage(action, schedule);
        const keyboard = this.buildScheduleKeyboard(action);

        await ctx.editMessageText(message, {
          parse_mode: 'Markdown',
          reply_markup: Markup.inlineKeyboard(keyboard)
        });
      }

      await ctx.answerCbQuery();
    } catch (error) {
      logger.error('Schedule callback error:', error);
      await ctx.answerCbQuery('❌ An error occurred. Please try again.');
    }
  }

  static async showWeeklySummary(ctx) {
    const summary = this.days.map(day => {
      const schedule = this.getScheduleForDay(day);
      if (schedule.length === 0) return null;

      const totalSKS = schedule.reduce((sum, item) => sum + item.SKS, 0);
      return `*${day}*: ${schedule.length} mata kuliah (${totalSKS} SKS)`;
    }).filter(Boolean);

    const message = '📊 *Ringkasan Mingguan*\n\n' + summary.join('\n');

    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('◀️ Kembali', `schedule_${this.days[moment().tz('Asia/Jakarta').day()]}`)]
      ])
    });
  }

  static async showSKSSummary(ctx) {
    const totalSKS = this.schedule.reduce((sum, item) => sum + item.SKS, 0);
    const sksByDay = {};

    this.days.forEach(day => {
      const schedule = this.getScheduleForDay(day);
      sksByDay[day] = schedule.reduce((sum, item) => sum + item.SKS, 0);
    });

    const message = '📋 *Ringkasan SKS*\n\n' +
      Object.entries(sksByDay)
        .filter(([_, sks]) => sks > 0)
        .map(([day, sks]) => `*${day}*: ${sks} SKS`)
        .join('\n') +
      `\n\n📚 Total SKS Semester: ${totalSKS}`;

    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('◀️ Kembali', `schedule_${this.days[moment().tz('Asia/Jakarta').day()]}`)]
      ])
    });
  }
}

module.exports = ScheduleHandler;
