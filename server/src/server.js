import { app } from './app.js';
import { config } from './config/index.js';

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`  Hello NSTUian API Server running on port ${PORT} `);
  console.log(`  Environment: ${config.env}`);
  console.log(`  Allowed EduMail: ${config.allowedEduMailDomains.join(', ')}`);
  console.log(`===============================================`);
});
