import { useState, useEffect } from 'react';
import A4Preview from '../components/question-builder/A4Preview';
import type { BuilderQuestion, BuilderHeader, BuilderSettings } from '../types/question-builder';
import { DEFAULT_SETTINGS } from '../types/question-builder';
import { DEFAULT_SETTINGS_ADDITIONS } from '../types/question-builder-additions';

const FULL_DEFAULT_SETTINGS = { ...DEFAULT_SETTINGS_ADDITIONS, ...DEFAULT_SETTINGS } as BuilderSettings;

const MobilePreviewPage = () => {
  const [questions, setQuestions] = useState<BuilderQuestion[]>([]);
  const [headers, setHeaders] = useState<BuilderHeader[]>([]);
  const [settings, setSettings] = useState<BuilderSettings>(FULL_DEFAULT_SETTINGS);

  useEffect(() => {
    // 💡 تابع حتماً باید async باشد تا بتوانیم await کنیم
    const handleMessage = async (event: MessageEvent | any) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        // ۱. دریافت داده‌های اولیه برای نمایش برگه
        if (data && data.type === 'SYNC_BUILDER_DATA') {
          if (data.payload.questions) setQuestions(data.payload.questions);
          if (data.payload.headers) setHeaders(data.payload.headers);
          if (data.payload.settings) setSettings(data.payload.settings);
        }

        // ۲. دریافت دستور ساخت PDF از موبایل
        if (data && data.type === 'REQUEST_PDF_LINK') {
          const element = document.querySelector('.a4-sheet') as HTMLElement;
          if (!element) return;

          // ایمپورت داینامیک پکیج‌ها
          const { toJpeg } = await import('html-to-image');
          const { jsPDF } = await import('jspdf');

          // الف) عکس‌برداری باکیفیت و سبک از برگه
          const dataUrl = await toJpeg(element, { 
            quality: 0.85, 
            pixelRatio: 1.5, 
            backgroundColor: '#ffffff', 
            style: { margin: '0', boxShadow: 'none' } 
          });

          // ب) ساخت PDF چند صفحه‌ای
          const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();
          const imgProps = pdf.getImageProperties(dataUrl);
          const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

          let heightLeft = imgHeight;
          let position = 0;
          
          pdf.addImage(dataUrl, 'JPEG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
          heightLeft -= pageHeight;
          
          while (heightLeft > 0) {
            position -= pageHeight;
            pdf.addPage();
            pdf.addImage(dataUrl, 'JPEG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
            heightLeft -= pageHeight;
          }

          // ج) تبدیل به Blob برای آپلود
          const pdfBlob = pdf.output('blob');
          const formData = new FormData();
          formData.append('pdf', pdfBlob, `azmoon-${Date.now()}.pdf`);

          // د) ارسال فایل به بک‌اند (همراه با توکنی که از موبایل گرفتیم)
          // ⚠️ توجه: آدرس IP مک‌بوک خود را چک کنید که درست باشد
          const response = await fetch('http://192.168.1.128:5001/api/teacher/builder/upload-pdf', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${data.token}` },
            body: formData
          });

          const result = await response.json();
          
          if (result.success) {
            // هـ) ارسال لینک دانلود به موبایل
            const rnWebView = (window as any).ReactNativeWebView;
            if (rnWebView) {
              rnWebView.postMessage(JSON.stringify({
                type: 'PDF_LINK_READY',
                link: result.link
              }));
            }
          } else {
            throw new Error(result.message);
          }
        }
      } catch (error: any) {
        console.error('Error in WebView message handler', error);
        
        // در صورت بروز هرگونه خطا، به موبایل اطلاع می‌دهیم
        const rnWebView = (window as any).ReactNativeWebView;
        if (rnWebView) {
          rnWebView.postMessage(JSON.stringify({ 
            type: 'ERROR', 
            message: error.message || 'خطا در ارتباط با سرور' 
          }));
        }
      }
    };

    window.addEventListener('message', handleMessage);
    document.addEventListener('message', handleMessage as any);

    return () => {
      window.removeEventListener('message', handleMessage);
      document.removeEventListener('message', handleMessage as any);
    };
  }, []);

  return (
    // ۱. قفل کردن کل صفحه روی سایز دسکتاپ (۱۰۲۴ پیکسل)
    <div style={{ 
      width: '1024px', 
      minHeight: '100vh', 
      backgroundColor: '#f8fafc', 
      paddingTop: '40px',
      paddingBottom: '40px',
    }}>
      
      {/* ۲. یک باکس نگهدارنده فیکس که اجازه نمی‌دهد A4Preview مچاله شود */}
      {/* عرض 850px باعث می‌شود برگه 794 پیکسلی A4 کاملاً جا شود */}
      <div style={{ width: '850px', margin: '0 auto' }}>
        <A4Preview
          headers={headers}
          selectedHeaderId={headers[0]?.id || null}
          questions={questions}
          settings={settings}
          onRemoveQuestion={() => {}}
          onMoveQuestion={() => {}}
          onUpdateScore={() => {}}
          onUpdateQuestion={() => {}}
          onSwapQuestion={() => {}}
          onUpdateHeaderField={() => {}}
          onUpdateHeaderCell={() => {}}
          onUpdateHeaderStandard1={() => {}}
          onUpdateHeaderStandard2={() => {}}
          onUpdateHeaderStandard4={() => {}}
          onUpdateHeaderCustom={() => {}}
          onUpdateGroupInstruction={() => {}}
        />
      </div>
      
    </div>
  );
};

export default MobilePreviewPage;