const mysql = require('mysql');
const config = require('config').util.toObject();
const connection = mysql.createPool({
    host     : config.databases.mysql.host,
    user     : config.databases.mysql.user,
    password : config.databases.mysql.password,
    database : config.databases.mysql.database,
    charset  : 'utf8mb4_unicode_ci'
});

connection.on('error', (err) => {
  console.log('Database error: ' + err)
});

const query = (sql, func) => {
  return new Promise((resolve, reject) => {
    connection.query(sql, func, function(error, results, fields) {
        if (error) {
          console.error(error.sqlMessage);
          return reject(new Error(error));
        }

        resolve(results);
    });
  });
}

const rowQuery = (sql, func) => {
  return new Promise((resolve, reject) => {
    connection.query(sql, func, function(error, results, fields) {
        if (error) {
          console.error(error.sqlMessage);
          return reject(new Error(error));
        }

        resolve(Object.values(JSON.parse(JSON.stringify(results)))[0]);
    });
  });
}

const rowsQuery = (sql, func) => {
  return new Promise((resolve, reject) => {
    connection.query(sql, func, function(error, results, fields) {
        if (error) {
          console.error(error.sqlMessage);
          return reject(new Error(error));
        }

        resolve(Object.values(JSON.parse(JSON.stringify(results))));
    });
  });
}

const showRows = (rows) => {
  console.error('showRows: DEPRECATED: Use rowQuery instead')

  if (rows) {
    return Object.values(JSON.parse(JSON.stringify(rows)))
  } else {
    throw new Error('No rows found')
  }
}

const ping = async () => {
  return connection.state ? true : false
}

module.exports = { query, showRows, ping, rowQuery, rowsQuery };