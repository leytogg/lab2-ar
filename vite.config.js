// vite.config.js
import basicSsl from '@vitejs/plugin-basic-ssl'

export default {
  plugins: [
    basicSsl({
      /** name of certification */
      name: 'test',
      /** custom trust domains */
      domains: ['*.custom.com'],
      /** optional, days before certificate expires */
      ttlDays: 30,
      /** custom certification directory */
      certDir: '/Users/.../.devServer/cert',
    }),
  ],
}