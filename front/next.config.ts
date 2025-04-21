/** next.config.js */
module.exports = {
  async rewrites() { //позволяет переписать url запрос не меняя адресную строку
    return [ //  проксируем запрос на бэк
      {
        source: '/api/:path*', // делаем доступ к бэкенду проще
        destination: 'http://localhost:8082/:path*', 
        // перенаправляем его на Go‑сервер
      },
    ]
  },
}
