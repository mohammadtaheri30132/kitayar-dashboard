const fs = require('fs');
const path = require('path');

// مسیر پوشه src (نسبت به محل اجرای اسکریپت)
const srcPath = path.join(process.cwd(), 'src');
// مسیر فایل خروجی
const outputPath = path.join(process.cwd(), 'src-contents.txt');

// تابع برای خواندن تمام فایل‌های یک پوشه به صورت بازگشتی
function readDirectoryRecursive(dirPath, basePath = '') {
    let result = '';
    
    try {
        const items = fs.readdirSync(dirPath);
        
        for (const item of items) {
            const fullPath = path.join(dirPath, item);
            const relativePath = basePath ? path.join(basePath, item) : item;
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                // اگر پوشه بود، به صورت بازگشتی ادامه بده
                result += readDirectoryRecursive(fullPath, relativePath);
            } else {
                // اگر فایل بود، محتوا را بخوان
                try {
                    const content = fs.readFileSync(fullPath, 'utf8');
                    result += `\n${'='.repeat(80)}\n`;
                    result += `📁 مسیر: ${relativePath}\n`;
                    result += `${'='.repeat(80)}\n`;
                    result += content;
                    result += `\n${'-'.repeat(80)}\n`;
                } catch (readError) {
                    result += `\n${'='.repeat(80)}\n`;
                    result += `📁 مسیر: ${relativePath}\n`;
                    result += `${'='.repeat(80)}\n`;
                    result += `❌ خطا در خواندن فایل: ${readError.message}\n`;
                    result += `${'-'.repeat(80)}\n`;
                }
            }
        }
    } catch (error) {
        result += `❌ خطا در خواندن پوشه: ${error.message}\n`;
    }
    
    return result;
}

// تابع اصلی
function generateFileList() {
    // بررسی وجود پوشه src
    if (!fs.existsSync(srcPath)) {
        console.error(`❌ پوشه "${srcPath}" وجود ندارد!`);
        console.log('لطفاً این اسکریپت را در کنار پوشه src اجرا کنید.');
        process.exit(1);
    }

    console.log('🔄 در حال اسکن پوشه src...');
    const result = readDirectoryRecursive(srcPath);
    
    // اضافه کردن هدر به فایل خروجی
    const header = `📂 لیست کامل فایل‌های پوشه src\n`;
    const separator = `${'='.repeat(80)}\n`;
    const footer = `\n✅ تعداد کل کاراکترها: ${result.length}\n`;
    
    const finalContent = header + separator + result + footer;
    
    // نوشتن در فایل خروجی
    try {
        fs.writeFileSync(outputPath, finalContent, 'utf8');
        console.log(`✅ فایل خروجی با موفقیت در "${outputPath}" ذخیره شد.`);
        console.log(`📊 تعداد کل کاراکترها: ${result.length}`);
    } catch (error) {
        console.error(`❌ خطا در ذخیره فایل خروجی: ${error.message}`);
        process.exit(1);
    }
}

// اجرای تابع اصلی
generateFileList();