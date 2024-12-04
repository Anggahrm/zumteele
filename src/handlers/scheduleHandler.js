const moment = require('moment-timezone');
const { Markup } = require('telegraf');
const logger = require('../utils/logger');

class ScheduleHandler {
  static schedule = [
    { No: 1, Kode: 'INF2133', Nama: 'Fisika: Optis dan Gelombang', Kelas: '12D', SKS: 2, Kampus: 'Kampus Gejayan', Waktu: 'Jumat, 15:21 - 17:00', Ruang: 'D-309-310' },
    { No: 2, Kode: 'INF2134', Nama: 'Kalkulus', Kelas: '12D', SKS: 3, Kampus: 'Kampus Gejayan', Waktu: 'Rabu, 07:01 - 09:30', Ruang: 'D-306-308' },
    { No: 3, Kode: 'INF2132P', Nama: 'Praktikum Algoritma & Pemrograman', Kelas: '12D1', SKS: 1, Kampus: 'Kampus Gejayan', Waktu: 'Senin, 15:21 - 17:00', Ruang: 'D-LAB1' },
    { No: 4, Kode: 'INF2132', Nama: 'Algoritma & Pemrograman', Kelas: '12D', SKS: 2, Kampus: 'Kampus Gejayan', Waktu: 'Selasa, 12:01 - 14:30', Ruang: 'D-306-308' },
    { No: 5, Kode: 'INF2131', Nama: 'Konsep Sistem Informasi', Kelas: '12D', SKS: 2, Kampus: 'Kampus Gejayan', Waktu: 'Selasa, 09:31 - 11:10', Ruang: 'D-304-305' }
  ];

  static days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  static async showSchedule(ctx) {
    try {
      const today = this.days[moment().tz('Asia/Jakarta').day()];
      const todaySchedule = this.schedule.filter(item => item.Waktu.startsWith(today));
      
      if (todaySchedule.length === 0) {
        await this.showDaySelection(ctx);
        return;
      }

      await this.showDaySchedule(ctx, today, todaySchedule);
    } catch (error) {
      logger.error('Schedule handler error:', error);
      await ctx.reply('❌ An error occurred while fetching the schedule.');
    }
  }

  static async showDaySelection(ctx) {
    const keyboard = this.days.map(day => [
      Markup.button.callback(day, `schedule_${day}`)
    ]);
    
    await ctx.reply(
      '📅 Select a day to view schedule:',
      Markup.inlineKeyboard(keyboard)
    );
  }

  static async showDaySchedule(ctx, day, schedule) {
    const message = schedule.length > 0 
      ? schedule.map(item =>
          `📚 *${item.Nama}*\n` +
          `🏷 Code: ${item.Kode}\n` +
          `👥 Class: ${item.Kelas}\n` +
          `⏰ Time: ${item.Waktu}\n` +
          `🏛 Room: ${item.Ruang}\n`
        ).join('\n')
      : 'No classes scheduled for this day.';

    await ctx.reply(
      `📅 *${day}'s Schedule*\n\n${message}`,
      { 
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('View Other Days', 'schedule_other')]
        ])
      }
    );
  }

  static async handleCallback(ctx) {
    try {
      const data = ctx.callbackQuery.data;
      const day = data.replace('schedule_', '');
      
      if (day === 'other') {
        await this.showDaySelection(ctx);
        return;
      }

      const daySchedule = this.schedule.filter(item => item.Waktu.startsWith(day));
      await ctx.editMessageText(
        `📅 *${day}'s Schedule*\n\n${this.formatSchedule(daySchedule)}`,
        { 
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('Back to Days', 'schedule_other')]
          ])
        }
      );
    } catch (error) {
      logger.error('Schedule callback error:', error);
      await ctx.answerCbQuery('❌ An error occurred. Please try again.');
    }
  }

  static formatSchedule(schedule) {
    if (schedule.length === 0) {
      return 'No classes scheduled for this day.';
    }

    return schedule.map(item =>
      `📚 *${item.Nama}*\n` +
      `🏷 Code: ${item.Kode}\n` +
      `👥 Class: ${item.Kelas}\n` +
      `⏰ Time: ${item.Waktu}\n` +
      `🏛 Room: ${item.Ruang}\n`
    ).join('\n');
  }
}

module.exports = ScheduleHandler;