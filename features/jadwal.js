const moment = require('moment-timezone');

const jadwalHandler = async (ctx) => {
  const schedule = [
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

  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const today = days[moment().tz('Asia/Jakarta').day()];

  const todaysSchedule = schedule.filter(item => item.Waktu.startsWith(today));

  if (todaysSchedule.length === 0) {
    await ctx.reply('Tidak ada mata kuliah hari ini.');
    return;
  }

  const scheduleMessage = todaysSchedule.map(item => 
    `${item.No}. ${item.Kode} - ${item.Nama} (${item.Kelas}, ${item.SKS} SKS, ${item.Kampus})\n   ${item.Waktu}, ${item.Ruang}`
  ).join('\n\n');

  await ctx.reply(`Jadwal Mata Kuliah Hari Ini:\n\n${scheduleMessage}`);
};

module.exports = { jadwalHandler };
