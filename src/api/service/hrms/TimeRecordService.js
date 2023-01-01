'use strict';

const { TimeRecord, User, Anviz, sequelize } = require('@models').system;
const { Op, Sequelize, QueryTypes } = require('sequelize');
const Excel = require('exceljs');
const moment = require('moment');
const status = require('http-status');
const { respondBadRequest, respondSuccess } = require('@utils/response');
const { respondCreated } = require('@utils/response');
const { getAllEntities } = require('@utils/request-handler');
const { findAndDelete } = require('@utils/request-handler');
const { findAndGet } = require('@utils/request-handler');
const { findAndUpdate } = require('@utils/request-handler');
const { getConnection } = require('@lib/sequelize');

/**
 *
 * delete a single time record by {id}
 *
 * id String id of table time record
 * returns Object
 **/
exports.deleteTimeRecordsId = async function (id) {
  return await findAndDelete(id, TimeRecord);
};

/**
 * Your GET endpoint
 * get all time records
 *
 * returns Object
 **/
exports.getTimeRecords = async function (query) {
  return await getAllEntities(query, TimeRecord);
};

/**
 * Your GET endpoint
 * download genrated excel report of actvity
 *
 * startTime String from witch time
 * endTime String to witch time
 * fake Boolean generate fake data or no (optional)
 * no response value expected for this operation
 **/
exports.getTimeRecordsGenerateexcel = async function (
  start_date,
  end_date,
  fake,
) {
  const st_date = new Date(start_date);
  const ed_date = new Date(end_date);
  const diffTime = Math.abs(ed_date - st_date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays > 365) {
    return respondBadRequest(
      'number of dates between two dates must letter than 365',
    );
  }

  const workbook = new Excel.Workbook();
  workbook.creator = 'system';
  workbook.lastModifiedBy = 'system';
  workbook.created = new Date();
  workbook.modified = new Date();
  const worksheet = workbook.addWorksheet('Main');
  const gen = await generateDateHeaders(start_date, end_date);
  await generateTemplateHeader(worksheet, gen);
  await generateRowDate(start_date, end_date, worksheet);
  return workbook;
};

const generateDateHeaders = function (start_date, end_date) {
  const dates = [];
  const dates_string = [];
  const date_names = [];
  const names_arr = [];
  const style = {
    font: {
      name: 'Arial',
      bold: true,
      size: 10,
    },
    alignment: {
      vertical: 'middle',
      horizontal: 'center',
    },
  };

  const currDate = moment(start_date).startOf('day');
  const lastDate = moment(end_date).endOf('day');
  let i = 0;
  while (currDate.diff(lastDate) < 0) {
    const tempDate = currDate.clone();
    dates.push(tempDate.toDate());
    names_arr.push('');
    names_arr.push(tempDate.format('DD/MM/YY'));

    date_names.push('');
    date_names.push(tempDate.format('dddd'));
    dates_string.push({
      header: tempDate.format('DD/MM/YY'),
      key: tempDate.format('DD/MM/YY'),
      // width: 17,
      style,
    });
    dates_string.push({
      key: i++,
      style,
    });
    i++;
    currDate.add(1, 'days');
  }
  return {
    dates,
    dates_string,
    date_names,
    names_arr,
  };
};
const generateTemplateHeader = function (worksheet, gen) {
  const headStyle = {
    font: {
      name: 'Arial',
      bold: true,
      size: 10,
    },
    alignment: {
      vertical: 'middle',
      horizontal: 'center',
    },
  };
  worksheet.columns = [
    {
      header: 'DATE',
      key: 'date',
      width: 17,
      style: headStyle,
    },
    ...gen.dates_string,
  ];
  for (let i = 0; i < gen.date_names.length; i += 2) {
    worksheet.mergeCells(1, i + 2, 1, i + 3);
  }

  const start_end = [];
  for (let i = 0; i < gen.date_names.length; i++) {
    const start_or_end = i % 2 == 0 ? 'End' : 'Start';
    start_end.push(start_or_end);
  }

  worksheet.addRow([...gen.date_names]);
  worksheet.addRow([...start_end, 'End']);

  for (let i = 0; i < gen.date_names.length; i += 2) {
    worksheet.mergeCells(2, i + 2, 2, i + 3);
  }

  worksheet.mergeCells('A2:A3');
  worksheet.getCell('A2').value = 'Employee';
  const last_col = gen.date_names.length;
  const base = 1;
  worksheet.mergeCells(2, last_col + base + 1, 3, last_col + base + 2);
  worksheet.mergeCells(2, last_col + base + 3, 3, last_col + base + 4);
  worksheet.mergeCells(2, last_col + base + 5, 3, last_col + base + 6);
  const alignment = {
    horizontal: 'center',
    vertical: 'middle',
  };
  worksheet.getCell(2, last_col + base + 1).value = 'Hours';
  worksheet.getCell(2, last_col + base + 1).style.font = headStyle.font;
  worksheet.getCell(2, last_col + base + 1).style.alignment = {
    horizontal: 'center',
    vertical: 'middle',
  };
  worksheet.getCell(2, last_col + base + 3).value = 'Extra Hours';
  worksheet.getCell(2, last_col + base + 3).style.font = headStyle.font;
  worksheet.getCell(2, last_col + base + 3).style.alignment = {
    horizontal: 'center',
    vertical: 'middle',
  };
  worksheet.getCell(2, last_col + base + 5).value = 'Total Hours';
  worksheet.getCell(2, last_col + base + 5).style.font = headStyle.font;
  worksheet.getCell(2, last_col + base + 5).style.alignment = {
    horizontal: 'center',
    vertical: 'middle',
  };
};

const generateRowDate = async function (start_date, end_date, worksheet) {
  const dates = getDates(new Date(start_date), new Date(end_date));
  const users = await User.findAll();
  let row = 4;
  let total = 0;
  let col = 2;
  for (let userIndex = 0; userIndex < users.length; userIndex++) {
    const user = users[userIndex];
    worksheet.getCell(row, 1).value = `${user.first_name} ${user.last_name}`;
    worksheet.getCell(row, 1).style.alignment = {
      horizontal: 'center',
      vertical: 'middle',
    };
    total = 0;
    col = 2;
    for (let dateIndex = 0; dateIndex < dates.length; dateIndex++) {
      const date = dates[dateIndex];
      let totalOfDay = 0;
      const todaysTimeRecords = await getTodayTimerecordsOfUser(
        new Date(date),
        user.id,
      );
      for (
        let timeRecordIndex = 0;
        timeRecordIndex < todaysTimeRecords.length;
        timeRecordIndex++
      ) {
        const timeRecord = todaysTimeRecords[timeRecordIndex];
        const timeStart = new Date(timeRecord.enter).getTime();
        const timeEnd = new Date(timeRecord.exit).getTime();
        totalOfDay = totalOfDay + (timeEnd - timeStart);
      }
      const StartAndEnd = getStartAndEndOfTimeRecords(todaysTimeRecords);
      // console.log("here");
      if (StartAndEnd !== null) {
        worksheet.getCell(row, col).value = StartAndEnd.first;
        worksheet.getCell(row, col + 1).value = StartAndEnd.last;
      }
      col = col + 2;
      total = total + totalOfDay;
    }
    worksheet.mergeCells(row, col, row, col + 1);
    worksheet.getCell(row, col).value = convertSecondToTime(total / 1000);
    worksheet.getCell(row, col).style.alignment = {
      horizontal: 'center',
      vertical: 'middle',
    };
    worksheet.getCell(row, col).style.font = {
      name: 'Arial',
      bold: true,
      size: 10,
    };
    row = row + 1;
  }
};

const convertSecondToTime = function (sec_num) {
  let hours = Math.floor(sec_num / 3600);
  // console.log(hours);
  let minutes = Math.floor((sec_num - hours * 3600) / 60);
  let seconds = sec_num - hours * 3600 - minutes * 60;

  if (hours < 10) {
    hours = '0' + hours;
  }
  if (minutes < 10) {
    minutes = '0' + minutes;
  }
  if (seconds < 10) {
    seconds = '0' + seconds;
  }
  return hours + ':' + minutes + ':' + seconds;
};

const getStartAndEndOfTimeRecords = function (timeRecords) {
  if (timeRecords[0] !== undefined) {
    return {
      first: timeRecords[0].enter.toISOString().slice(0, 19).split('T')[1],
      last: timeRecords[timeRecords.length - 1].exit
        .toISOString()
        .slice(0, 19)
        .split('T')[1],
    };
  }
  return null;
};

/**
 * Your GET endpoint
 * get a single time record by {id}
 *
 * id String id of table time record
 * returns Object
 **/
exports.getTimeRecordsId = async function (id) {
  return await findAndGet(id, TimeRecord);
};

/**
 * Your GET endpoint
 * get all time record of a user
 *
 * id String id of a user
 * returns Object
 **/
exports.getTimeRecordsOfuser = async function (id) {
  return await TimeRecord.findAll({
    where: {
      user_id: id,
    },
  });
};

/**
 * Your GET endpoint
 * calculate activity time between two time for selected user
 *
 * startTime String from witch date
 * endTime String to witch date
 * fake Boolean generate fake or no
 * user_id String witch user
 * returns Object
 **/
exports.getTimeRecordsUserGenerateexcel = async function (
  start_date,
  end_date,
  user_id,
) {
  const dates = getDates(new Date(start_date), new Date(end_date));
  const workbook = new Excel.Workbook();
  const widthCell = 20;
  const headStyle = {
    font: {
      name: 'Arial',
      bold: true,
      size: 10,
    },
    alignment: {
      vertical: 'middle',
      horizontal: 'center',
    },
  };

  workbook.creator = 'system';
  workbook.lastModifiedBy = 'system';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('user activity');
  sheet.mergeCells(1, 1, 2, 1);
  sheet.getCell(1, 1).value = 'DATE/TIME';
  sheet.getColumn(1).style = headStyle;
  sheet.getColumn(1).width = widthCell;
  sheet.getRow(1).style = headStyle;
  sheet.getCell(1, 1).style = headStyle;
  sheet.getCell(1, 1).width = widthCell;
  sheet.getRow(2).style = headStyle;
  let row = 3;
  let column = 2;
  let numberOfTimeRecords = 0;
  let total = 0;
  const totalOfDays = [];
  let todayString = '';
  for (let index = 0; index < dates.length; index++, row++) {
    const today = dates[index];
    todayString = moment(today).format('YYYY-MM-DD');
    sheet.getCell(row, 1).value = todayString;
    column = 2;
    const todaysTimeRecord = await getTodayTimerecordsOfUser(
      new Date(today),
      user_id,
    );
    if (todaysTimeRecord.length > numberOfTimeRecords) {
      numberOfTimeRecords = todaysTimeRecord.length;
    }
    let totalOfToday = 0;
    for (let index = 0; index < todaysTimeRecord.length; index++) {
      const timeRecordOfToday = todaysTimeRecord[index];
      const enterTime = new Date(timeRecordOfToday.enter);
      const exitTime = new Date(timeRecordOfToday.exit);
      sheet.getCell(row, column).value = enterTime.toTimeString().split(' ')[0]; //start time of each time record
      sheet.getCell(row, column).style.alignment = {
        vertical: 'middle',
        horizontal: 'center',
      };
      sheet.getCell(row, column + 1).value = exitTime
        .toTimeString()
        .split(' ')[0]; //end time of each time record
      sheet.getCell(row, column + 1).style.alignment = {
        vertical: 'middle',
        horizontal: 'center',
      };
      column += 2;
      totalOfToday += exitTime.getTime() - enterTime.getTime();
    }
    totalOfDays.push(convertSecondToTime(totalOfToday / 1000));
    total += totalOfToday;
  }

  totalOfDays.push(convertSecondToTime(total / 1000));

  // init header after init body :)
  column = 2;
  for (let index = 0; index < numberOfTimeRecords; index++) {
    sheet.mergeCells(1, column, 1, column + 1);
    sheet.getCell(1, column).value = `time record ${index + 1}`;
    sheet.getCell(2, column).value = 'enter';
    sheet.getCell(2, column + 1).value = 'exit';
    column += 2;
  }

  row = 3;
  let index = 0;
  for (; index < dates.length; index++, row++) {
    sheet.mergeCells(
      row,
      (numberOfTimeRecords + 1) * 2,
      row,
      (numberOfTimeRecords + 1) * 2 + 1,
    );
    sheet.getCell(
      row,
      (numberOfTimeRecords + 1) * 2,
    ).value = `total of day: ${totalOfDays[index]}`;
  }
  sheet.mergeCells(
    row,
    (numberOfTimeRecords + 1) * 2,
    row,
    (numberOfTimeRecords + 1) * 2 + 1,
  );
  sheet.getCell(
    row,
    (numberOfTimeRecords + 1) * 2,
  ).value = `total: ${totalOfDays[index]}`;

  await workbook.xlsx.writeFile('./test.xlsx');
};

exports.getUserActivityBetweenTimes = async (start_date, end_date, user_id) => {
  const dates = getDates(new Date(start_date), new Date(end_date));
  const total_of_days = {};
  let total = 0;
  for (let index = 0; index < dates.length; index++) {
    const today = dates[index];
    const todayString = new Date(today).toISOString().split('T')[0];
    const todaysTimeRecord = await getTodayTimerecordsOfUser(
      new Date(today),
      user_id,
    );
    let totalOfToday = 0;
    for (let index = 0; index < todaysTimeRecord.length; index++) {
      const timeRecordOfToday = todaysTimeRecord[index];
      const enterTime = new Date(timeRecordOfToday.enter);
      const exitTime = new Date(timeRecordOfToday.exit);
      totalOfToday += exitTime.getTime() - enterTime.getTime();
    }
    total_of_days[todayString] = totalOfToday;
    total += totalOfToday;
  }
  total_of_days.total = total;
  total_of_days.user_id = user_id;
  return respondSuccess(total_of_days);
};

/**
 *
 * add a time record (of a user) to system
 *
 * body Body  (optional)
 * returns Object
 **/
exports.postTimeRecords = async function (body, creator_id) {
  if (
    typeof body.user_id == 'undefined' ||
    (await User.findByPk(body.user_id)) === null
  ) {
    return respondBadRequest('user not found');
  }
  if (
    typeof body.anviz_id == 'undefined' ||
    (await Anviz.findByPk(body.anviz_id)) === null
  ) {
    return respondBadRequest('anviz not found');
  }
  body.creator_id = creator_id;
  return respondCreated(await TimeRecord.create(body));
};

exports.postTimeRecordByDeviceId = async function (body, creator_id) {
  if (
    typeof body.user_id == 'undefined' ||
    (await User.findByPk(body.user_id)) === null
  ) {
    return respondBadRequest('user not found');
  }

  const device = await Anviz.findOne({
    where: {
      device_id: body.anviz_id,
    },
  });

  if (typeof body.anviz_id == 'undefined' || device === null) {
    return respondBadRequest('anviz not found');
  }

  body.creator_id = creator_id;

  return await TimeRecord.create(body);
};

/**
 *
 * get last time record of a selected user in selected anviz device and if exit setted create a new timeRecord and else set exit last time Record.
 *
 * body Body  (optional)
 * returns Object
 **/

exports.putTimeRecordsDoclock = async function (body, creator_id) {
  const TODAY_START = moment().format('YYYY-MM-DD 00:00:01');
  const TODAY_END = moment().format('YYYY-MM-DD 23:59:59');

  const { anviz_id, user_id } = body;

  const timeRecord = await TimeRecord.findOne({
    where: {
      anviz_id,
      user_id,
      enter: {
        [Op.gte]: TODAY_START,
        [Op.lte]: TODAY_END,
      },
    },
    include: {
      all: true,
    },
    order: [['enter', 'DESC']],
  });

  if (timeRecord !== null && timeRecord.exit === null) {
    //update a time record
    timeRecord.exit = new Date();
    timeRecord.save();
    return respondSuccess(timeRecord);
  } else {
    const createdTimeRecord = await TimeRecord.create({
      user_id,
      anviz_id,
      enter: new Date(),
      creator_id,
    });
    return respondCreated(
      await TimeRecord.findByPk(createdTimeRecord.id, {
        include: {
          all: true,
        },
      }),
    );
  }
};

const getTodayTimerecordsOfUser = async function (date, user_id) {
  return await TimeRecord.findAll({
    where: {
      user_id,
      enter: {
        [Op.gte]: date.setHours(0, 0, 0, 0),
        [Op.lte]: date.setHours(23, 59, 59, 999),
      },
    },
  });
};

function getDates(startDate, stopDate) {
  /**
   * @param {Date} date
   * @param {number} days
   * @returns
   */
  const addDays = (date, days) => {
    const newDate = new Date(date.valueOf());
    newDate.setDate(newDate.getDate() + days);
    return newDate;
  };

  const dateArray = [];
  let currentDate = startDate;
  while (currentDate <= stopDate) {
    dateArray.push(new Date(currentDate));
    currentDate = addDays(currentDate, 1);
  }

  return dateArray;
}

/**
 *
 * update a single time record by {id}
 *
 * id String id of table time record
 * body Body change enter time (update columnt enter) (optional)
 * returns Object
 **/
exports.putTimeRecordsId = async function (id, body) {
  return await findAndUpdate(id, body, TimeRecord);
};

/**
 *
 * set exit on selected time record
 *
 * body Body  (optional)
 * returns Object
 **/
exports.putTimeRecordsSetexit = async function (body) {
  const { timeRecord_id } = body;

  const timeRecord = await TimeRecord.findByPk(timeRecord_id);

  if (typeof timeRecord_id == 'undefined' || timeRecord === null) {
    respondBadRequest('time record not found');
  }
  //update a time record
  timeRecord.exit = new Date();
  timeRecord.save();
  return timeRecord;
};

/**
 *
 * set exit for all time record that not setted exit in today in selected device.
 *
 * body Body  (optional)
 * returns Object
 **/
exports.putTimeRecordsSetexitall = async function () {
  const TODAY_START = moment().format('YYYY-MM-DD 00:00:01');
  const TODAY_END = moment().format('YYYY-MM-DD 23:59:59');
  const time = moment().format('YYYY-MM-DD HH:mm:ss');
  await TimeRecord.update(
    {
      exit: time,
    },
    {
      where: {
        exit: null,
        enter: {
          [Op.gte]: TODAY_START,
          [Op.lte]: TODAY_END,
        },
      },
    },
  );

  return respondSuccess('time records updated');
};

exports.getTodayTimerecordsByUserId = async function (body) {
  const { user_id } = body;

  const now = moment().startOf('day').valueOf();
  const userTodayTimerecords = await getTodayTimerecordsOfUser(
    new Date(now),
    user_id,
  );
  return userTodayTimerecords;
};

exports.getTodaysLastTimeRecords = async function (query) {
  // TODO(erfan): migrate to knex
  const exeQuery =
    'select `id`,`final_max`.`user_id`,`anviz_id`,`creator_id`,`updated_at`,`created_at`,`deleted_at`,`enter`,`exit` from ((select * ,`enter` as `selected_time` from `hrms_timerecords` UNION select *,`exit` as `selected_time` from `hrms_timerecords`) `all_enter_exit` inner join (select `user_id`, max(`new_tab`.`max_of_enter_exit`) as `max_item` from (SELECT `id`,`user_id`,`enter`,`exit`,GREATEST(`enter`, `exit`) as `max_of_enter_exit` FROM `hrms_timerecords`) as `new_tab` group by `user_id`) as `final_max` on `final_max`.`user_id` = `all_enter_exit`.`user_id` and `final_max`.`max_item` = `all_enter_exit`.`selected_time`)';
  const timerecords = await sequelize.query(exeQuery, {
    type: QueryTypes.SELECT,
    nest: true,
  });
  const ids = timerecords.map((tr) => tr.id);
  return getAllEntities(
    query,
    TimeRecord,
    {
      id: ids,
    },
    {
      all: true,
    },
  );
};
