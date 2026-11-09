import React, { useState, useEffect, useMemo } from 'react';
import {
  phonebookService,
  type PhonebookCategoryItem,
  type PhonebookContactItem,
} from '../services/phonebookService';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

export const PhonebookManagementPage: React.FC = () => {
  // Data State
  const [categories, setCategories] = useState<PhonebookCategoryItem[]>([]);
  const [contacts, setContacts] = useState<PhonebookContactItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [contactsLoading, setContactsLoading] = useState<boolean>(false);

  // Selection & Navigation
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterEmergency, setFilterEmergency] = useState<boolean>(false);

  // Modals
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<PhonebookCategoryItem | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    title: '',
    description: '',
    icon: 'phone',
    color: '#3b82f6',
    parentId: '',
    isEmergency: false,
    order: 0,
  });

  const [showContactModal, setShowContactModal] = useState<boolean>(false);
  const [editingContact, setEditingContact] = useState<PhonebookContactItem | null>(null);
  const [contactForm, setContactForm] = useState({
    title: '',
    phoneNumber: '',
    phoneSecondary: '',
    internalNumber: '',
    categoryId: '',
    department: '',
    responsiblePerson: '',
    city: '',
    address: '',
    description: '',
    isEmergency: false,
    order: 0,
  });

  // Batch Import Modal (JSON & Excel)
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importMode, setImportMode] = useState<'file' | 'jsonText'>('file');
  const [jsonInputText, setJsonInputText] = useState<string>('');
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [importTargetCatId, setImportTargetCatId] = useState<string>('');
  const [isImporting, setIsImporting] = useState<boolean>(false);

  // Load all categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Load contacts whenever selected category, search, or emergency filter changes
  useEffect(() => {
    loadContacts();
  }, [selectedCategoryId, filterEmergency]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await phonebookService.getCategories();
      if (res.success) {
        setCategories(res.categories || []);
      }
    } catch (err: any) {
      toast.error('خطا در دریافت دسته‌بندی‌ها');
    } finally {
      setLoading(false);
    }
  };

  const loadContacts = async () => {
    try {
      setContactsLoading(true);
      const params: any = { limit: 100 };
      if (selectedCategoryId) params.categoryId = selectedCategoryId;
      if (filterEmergency) params.isEmergency = true;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await phonebookService.getContacts(params);
      if (res.success) {
        setContacts(res.contacts || []);
      }
    } catch (err: any) {
      toast.error('خطا در دریافت لیست شماره‌ها');
    } finally {
      setContactsLoading(false);
    }
  };

  // Filtered contacts based on search query
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const q = searchQuery.trim().toLowerCase();
    return contacts.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.phoneNumber.includes(q) ||
        (c.phoneSecondary && c.phoneSecondary.includes(q)) ||
        (c.department && c.department.toLowerCase().includes(q)) ||
        (c.responsiblePerson && c.responsiblePerson.toLowerCase().includes(q)) ||
        (c.city && c.city.toLowerCase().includes(q))
    );
  }, [contacts, searchQuery]);

  // Hierarchical categories map
  const { rootCategories, subcategoriesByParent } = useMemo(() => {
    const roots: PhonebookCategoryItem[] = [];
    const subsMap: Record<string, PhonebookCategoryItem[]> = {};

    categories.forEach((cat) => {
      if (!cat.parentId) {
        roots.push(cat);
      } else {
        const pId = String(cat.parentId);
        if (!subsMap[pId]) subsMap[pId] = [];
        subsMap[pId].push(cat);
      }
    });

    return { rootCategories: roots, subcategoriesByParent: subsMap };
  }, [categories]);

  // Selected Category Object
  const selectedCategory = useMemo(() => {
    if (!selectedCategoryId) return null;
    return categories.find((c) => c._id === selectedCategoryId) || null;
  }, [categories, selectedCategoryId]);

  // Breadcrumbs calculation
  const breadcrumbTrail = useMemo(() => {
    if (!selectedCategory) return [];
    const trail: PhonebookCategoryItem[] = [];
    let curr: PhonebookCategoryItem | undefined = selectedCategory;

    while (curr) {
      trail.unshift(curr);
      if (curr.parentId) {
        curr = categories.find((c) => c._id === String(curr?.parentId));
      } else {
        break;
      }
    }
    return trail;
  }, [selectedCategory, categories]);

  // Category Modal Handlers
  const handleOpenAddCategory = (parentId?: string) => {
    setEditingCategory(null);
    setCategoryForm({
      title: '',
      description: '',
      icon: parentId ? 'folder' : 'phone',
      color: '#3b82f6',
      parentId: parentId || '',
      isEmergency: false,
      order: 0,
    });
    setShowCategoryModal(true);
  };

  const handleOpenEditCategory = (cat: PhonebookCategoryItem) => {
    setEditingCategory(cat);
    setCategoryForm({
      title: cat.title,
      description: cat.description || '',
      icon: cat.icon || 'phone',
      color: cat.color || '#3b82f6',
      parentId: cat.parentId ? String(cat.parentId) : '',
      isEmergency: cat.isEmergency || false,
      order: cat.order || 0,
    });
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.title.trim()) {
      toast.error('عنوان دسته‌بندی الزامی است');
      return;
    }

    try {
      if (editingCategory) {
        await phonebookService.updateCategory(editingCategory._id, categoryForm);
        toast.success('دسته‌بندی با موفقیت ویرایش شد');
      } else {
        await phonebookService.createCategory(categoryForm);
        toast.success('دسته‌بندی با موفقیت ایجاد شد');
      }
      setShowCategoryModal(false);
      loadCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'خطا در ثبت دسته‌بندی');
    }
  };

  const handleDeleteCategory = async (cat: PhonebookCategoryItem) => {
    if (
      !window.confirm(
        `آیا از حذف دسته‌بندی «${cat.title}» و تمام زیردسته‌ها و شماره‌های آن اطمینان دارید؟`
      )
    ) {
      return;
    }

    try {
      await phonebookService.deleteCategory(cat._id);
      toast.success('دسته‌بندی با موفقیت حذف شد');
      if (selectedCategoryId === cat._id) {
        setSelectedCategoryId(null);
      }
      loadCategories();
      loadContacts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'خطا در حذف دسته‌بندی');
    }
  };

  // Contact Modal Handlers
  const handleOpenAddContact = () => {
    setEditingContact(null);
    setContactForm({
      title: '',
      phoneNumber: '',
      phoneSecondary: '',
      internalNumber: '',
      categoryId: selectedCategoryId || (categories[0]?._id ?? ''),
      department: '',
      responsiblePerson: '',
      city: '',
      address: '',
      description: '',
      isEmergency: false,
      order: 0,
    });
    setShowContactModal(true);
  };

  const handleOpenEditContact = (c: PhonebookContactItem) => {
    setEditingContact(c);
    const catId = typeof c.categoryId === 'object' ? c.categoryId?._id : c.categoryId;
    setContactForm({
      title: c.title,
      phoneNumber: c.phoneNumber,
      phoneSecondary: c.phoneSecondary || '',
      internalNumber: c.internalNumber || '',
      categoryId: catId || '',
      department: c.department || '',
      responsiblePerson: c.responsiblePerson || '',
      city: c.city || '',
      address: c.address || '',
      description: c.description || '',
      isEmergency: c.isEmergency || false,
      order: c.order || 0,
    });
    setShowContactModal(true);
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.title.trim() || !contactForm.phoneNumber.trim()) {
      toast.error('عنوان و شماره تلفن الزامی هستند');
      return;
    }
    if (!contactForm.categoryId) {
      toast.error('لطفاً یک دسته‌بندی انتخاب کنید');
      return;
    }

    try {
      if (editingContact) {
        await phonebookService.updateContact(editingContact._id, contactForm);
        toast.success('مخاطب با موفقیت ویرایش شد');
      } else {
        await phonebookService.createContact(contactForm);
        toast.success('مخاطب با موفقیت ایجاد شد');
      }
      setShowContactModal(false);
      loadContacts();
      loadCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'خطا در ذخیره مخاطب');
    }
  };

  const handleDeleteContact = async (c: PhonebookContactItem) => {
    if (!window.confirm(`آیا از حذف «${c.title}» مطمئن هستید؟`)) return;

    try {
      await phonebookService.deleteContact(c._id);
      toast.success('مخاطب حذف شد');
      loadContacts();
      loadCategories();
    } catch (err: any) {
      toast.error('خطا در حذف مخاطب');
    }
  };

  // Helper to flatten nested categories tree into contact preview rows
  const flattenCategoriesTree = (cats: any[]): any[] => {
    const list: any[] = [];
    const traverse = (catList: any[], parentName = '') => {
      for (const cat of catList) {
        const catTitle = cat.title || cat.name || '';
        const currentCategory = parentName ? parentName : catTitle;
        const currentSubcategory = parentName ? catTitle : '';

        if (Array.isArray(cat.contacts)) {
          for (const c of cat.contacts) {
            list.push({
              ...c,
              category: c.category || currentCategory,
              subcategory: c.subcategory || currentSubcategory,
            });
          }
        }
        const sub = cat.subcategories || cat.children;
        if (Array.isArray(sub) && sub.length > 0) {
          traverse(sub, currentCategory);
        }
      }
    };
    traverse(cats);
    return list;
  };

  // Unified File Parsing (JSON, XLSX, XLS, CSV)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isJson = file.name.endsWith('.json') || file.type === 'application/json';

    if (isJson) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const content = evt.target?.result as string;
          const parsed = JSON.parse(content);
          let rows: any[] = [];

          if (Array.isArray(parsed)) {
            const first = parsed[0];
            if (first && (first.contacts || first.subcategories || first.children)) {
              rows = flattenCategoriesTree(parsed);
            } else {
              rows = parsed;
            }
          } else if (parsed && typeof parsed === 'object') {
            if (Array.isArray(parsed.categories)) {
              rows = flattenCategoriesTree(parsed.categories);
            } else if (Array.isArray(parsed.contacts)) {
              rows = parsed.contacts;
            } else if (Array.isArray(parsed.items)) {
              rows = parsed.items;
            } else {
              rows = [parsed];
            }
          }

          if (rows.length === 0) {
            toast.error('فایل JSON فاقد شماره تلفن یا لیست مخاطبین است');
            return;
          }

          setPreviewRows(rows);
          toast.success(`✅ تعداد ${rows.length} مخاطب از فایل JSON خوانده شد`);
        } catch (err: any) {
          toast.error('خطا در پردازش فایل JSON: ' + err.message);
        }
      };
      reader.readAsText(file);
    } else {
      // Excel handling
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);

          if (!data || data.length === 0) {
            toast.error('فایل انتخابی خالی است یا ستون‌های نامعتبر دارد');
            return;
          }

          setPreviewRows(data);
          toast.success(`✅ تعداد ${data.length} ردیف از فایل اکسل خوانده شد`);
        } catch (err) {
          toast.error('خطا در پردازش فایل اکسل. مطمئن شوید فرمت فایل معتبر است.');
        }
      };
      reader.readAsBinaryString(file);
    }
  };

  // Parse Raw JSON Text from Textarea
  const handleParseJsonText = () => {
    if (!jsonInputText.trim()) {
      toast.error('لطفاً ابتدا کد JSON را در کادر وارد کنید');
      return;
    }

    try {
      const parsed = JSON.parse(jsonInputText);
      let rows: any[] = [];

      if (Array.isArray(parsed)) {
        const first = parsed[0];
        if (first && (first.contacts || first.subcategories || first.children)) {
          rows = flattenCategoriesTree(parsed);
        } else {
          rows = parsed;
        }
      } else if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.categories)) {
          rows = flattenCategoriesTree(parsed.categories);
        } else if (Array.isArray(parsed.contacts)) {
          rows = parsed.contacts;
        } else if (Array.isArray(parsed.items)) {
          rows = parsed.items;
        } else {
          rows = [parsed];
        }
      }

      if (rows.length === 0) {
        toast.error('کد JSON معتبر است اما هیچ مخاطبی در آن یافت نشد');
        return;
      }

      setPreviewRows(rows);
      toast.success(`✅ تعداد ${rows.length} مخاطب از متن JSON با موفقیت استخراج شد`);
    } catch (err: any) {
      toast.error('خطای نگارشی در کد JSON: ' + err.message);
    }
  };

  // Confirm Import
  const handleConfirmImport = async () => {
    if (previewRows.length === 0) {
      toast.error('هیچ داده‌ای برای ذخیره وجود ندارد');
      return;
    }

    try {
      setIsImporting(true);
      const res = await phonebookService.importJson(previewRows, importTargetCatId || undefined);
      if (res.success) {
        toast.success(res.message || 'اطلاعات با موفقیت ذخیره شد');
        setShowImportModal(false);
        setPreviewRows([]);
        setJsonInputText('');
        loadCategories();
        loadContacts();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'خطا در ورود گروهی شماره‌ها');
    } finally {
      setIsImporting(false);
    }
  };

  // Download Sample JSON
  const handleDownloadSampleJson = () => {
    const sampleData = [
      {
        title: 'خط اورژانس اجتماعی کشور',
        phoneNumber: '123',
        category: 'تماس‌های اضطراری و امدادی',
        department: 'اورژانس اجتماعی بهزیستی',
        city: 'سراسری',
        description: 'امداد شبانه‌روزی آسیب‌های فردی، خانوادگی و اجتماعی',
        isEmergency: true,
      },
      {
        title: 'خط ملی نماد (مراقبت اجتماعی دانش‌آموزان)',
        phoneNumber: '1570',
        category: 'مراکز مشاوره و سلامت روان',
        department: 'اداره کل امور تربیتی و مشاوره',
        city: 'سراسری',
        description: 'خط مشاوره و حمایت روانی، تحصیلی و رفتاری دانش‌آموزان و معلمان',
        isEmergency: true,
      },
      {
        title: 'تلفنخانه مرکزی وزارت آموزش و پرورش',
        phoneNumber: '02182281111',
        phoneSecondary: '02182282222',
        internalNumber: '101',
        category: 'وزارت آموزش و پرورش',
        subcategory: 'ستاد مرکزی',
        department: 'روابط عمومی و دبیرخانه',
        responsiblePerson: 'مسئول ارتباطات مردمی',
        city: 'تهران',
        address: 'خیابان سپهبد قرنی، نبش خیابان سمیه',
        description: 'پاسخگویی شنبه تا چهارشنبه ۸ الی ۱۴',
        isEmergency: false,
      },
      {
        title: 'سازمان پژوهش و برنامه‌ریزی آموزشی (کتب درسی)',
        phoneNumber: '02188831111',
        internalNumber: '205',
        category: 'سازمان‌های وابسته',
        department: 'دفتر تالیف کتاب‌های درسی',
        responsiblePerson: 'دبیرخانه',
        city: 'تهران',
        address: 'خیابان ایرانشهر شمالی، پلاک ۲۷۰',
        description: 'پایگاه کتب درسی و برنامه‌ریزی درسی',
        isEmergency: false,
      },
      {
        title: 'اداره کل آموزش و پرورش شهر تهران',
        phoneNumber: '02188900000',
        phoneSecondary: '02188900001',
        category: 'ادارات کل استان‌ها',
        subcategory: 'تهران',
        department: 'اداره سنجش و امتحانات',
        responsiblePerson: 'رئیس اداره سنجش',
        city: 'تهران',
        address: 'خیابان طالقانی، نرسیده به میدان فلسطین',
        description: 'امور امتحانات نهایی و تصحیح اوراق',
        isEmergency: false,
      },
      {
        title: 'دبیرستان فرزانگان ۱ (سمپاد)',
        phoneNumber: '02188001234',
        internalNumber: '11',
        category: 'مدارس شاخص و نمونه',
        subcategory: 'تهران',
        department: 'دفتر مدیریت',
        responsiblePerson: 'خانم دکتر حسینی',
        city: 'تهران',
        address: 'خیابان کارگر شمالی، خیابان شانزدهم',
        description: 'دبیرستان دوره دوم استعدادهای درخشان',
        isEmergency: false,
      },
    ];

    const blob = new Blob([JSON.stringify(sampleData, null, 2)], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'kitayar_phonebook_sample.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('فایل نمونه JSON دانلود شد');
  };

  // Download Sample Excel Template
  const handleDownloadSampleExcel = () => {
    const sampleData = [
      {
        'عنوان': 'اورژانس کشور',
        'شماره تماس': '115',
        'شماره دوم': '',
        'داخلی': '',
        'دسته‌بندی': 'تماس‌های اضطراری',
        'زیردسته': '',
        'واحد': 'فوریت‌های پزشکی',
        'مسئول': '',
        'شهر': 'سراسری',
        'توضیحات': 'امداد شبانه‌روزی',
        'اضطراری': 'بله',
      },
      {
        'عنوان': 'آتش‌نشانی',
        'شماره تماس': '125',
        'شماره دوم': '',
        'داخلی': '',
        'دسته‌بندی': 'تماس‌های اضطراری',
        'زیردسته': '',
        'واحد': 'امداد و نجات',
        'مسئول': '',
        'شهر': 'سراسری',
        'توضیحات': 'خدمات ایمنی و اطفای حریق',
        'اضطراری': 'بله',
      },
      {
        'عنوان': 'تلفنخانه مرکزی وزارت آموزش و پرورش',
        'شماره تماس': '021-82281111',
        'شماره دوم': '021-82282222',
        'داخلی': '101',
        'دسته‌بندی': 'وزارت آموزش و پرورش',
        'زیردسته': 'ستاد مرکزی',
        'واحد': 'روابط عمومی',
        'مسئول': 'دبیرخانه',
        'شهر': 'تهران',
        'توضیحات': 'خیابان سپهبد قرنی',
        'اضطراری': 'خیر',
      },
      {
        'عنوان': 'دبیرستان فرهنگ منطقه ۵',
        'شماره تماس': '021-44081234',
        'شماره دوم': '09123456789',
        'داخلی': '12',
        'دسته‌بندی': 'استان تهران',
        'زیردسته': 'آموزش و پرورش منطقه ۵',
        'واحد': 'دفتر مدیریت',
        'مسئول': 'آقای احمدی',
        'شهر': 'تهران',
        'توضیحات': 'مدرسه متوسطه دوم پسرانه',
        'اضطراری': 'خیر',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'مخاطبین');
    XLSX.writeFile(wb, 'phonebook_sample_template.xlsx');
    toast.success('فایل نمونه اکسل دانلود شد');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-right" dir="rtl">
      {/* Top Banner & Actions */}
      <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 border border-blue-700/30 rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                📞
              </span>
              مدیریت دفترچه تلفن و اطلاعات تماس
            </h1>
            <p className="text-sm text-gray-400 mt-2">
              مدیریت دسته‌بندی‌های تو در تو (استان‌ها، مدارس، بخش‌ها)، ثبت دستی و ورود گروهی شماره‌ها از طریق اکسل
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleDownloadSampleJson}
              className="px-3.5 py-2 rounded-xl bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700 text-gray-200 text-sm font-medium transition flex items-center gap-2 shadow-sm"
              title="دریافت قالب ساختاریافته JSON"
            >
              📥 نمونه JSON
            </button>

            <button
              onClick={handleDownloadSampleExcel}
              className="px-3.5 py-2 rounded-xl bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700 text-gray-200 text-sm font-medium transition flex items-center gap-2 shadow-sm"
              title="دریافت قالب اکسل"
            >
              📥 نمونه اکسل
            </button>

            <button
              onClick={() => {
                setPreviewRows([]);
                setJsonInputText('');
                setShowImportModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition flex items-center gap-2 shadow-sm"
            >
              📥 ورود گروهی (JSON / اکسل)
            </button>

            <button
              onClick={() => handleOpenAddCategory(selectedCategoryId || undefined)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition flex items-center gap-2 shadow-sm"
            >
              📁 دسته‌بندی جدید
            </button>

            <button
              onClick={handleOpenAddContact}
              className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition flex items-center gap-2 shadow-sm"
            >
              ➕ مخاطب جدید
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Tree / Categories & Right Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Categories Sidebar (4 cols) */}
        <div className="lg:col-span-4 bg-gray-900/60 border border-gray-800/80 rounded-2xl p-4 shadow-lg flex flex-col h-[750px]">
          <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-3">
            <div className="flex items-center gap-2 font-bold text-gray-200 text-sm">
              <span>🗂️</span>
              <span>دسته‌بندی‌های تلفن</span>
              <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
                {categories.length}
              </span>
            </div>
            <button
              onClick={() => handleOpenAddCategory()}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium px-2 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition"
            >
              + دسته اصلی
            </button>
          </div>

          {/* All Categories Option */}
          <div
            onClick={() => setSelectedCategoryId(null)}
            className={`p-3 rounded-xl cursor-pointer transition flex items-center justify-between mb-2 border ${
              selectedCategoryId === null
                ? 'bg-blue-600/20 border-blue-500/50 text-white'
                : 'bg-gray-800/40 border-gray-800 text-gray-300 hover:bg-gray-800/80'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span>🌐</span>
              <span className="text-sm font-semibold">همه شماره‌ها</span>
            </div>
            <span className="text-xs bg-gray-800 px-2 py-0.5 rounded-md text-gray-400">
              {contacts.length}
            </span>
          </div>

          {/* Category Tree Scroll Container */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {rootCategories.map((root) => {
              const subcats = subcategoriesByParent[root._id] || [];
              const isSelected = selectedCategoryId === root._id;

              return (
                <div key={root._id} className="rounded-xl border border-gray-800/60 overflow-hidden bg-gray-800/20">
                  {/* Root Category Row */}
                  <div
                    onClick={() => setSelectedCategoryId(root._id)}
                    className={`p-2.5 flex items-center justify-between cursor-pointer transition ${
                      isSelected
                        ? 'bg-primary-600/20 text-white font-semibold'
                        : 'text-gray-300 hover:bg-gray-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: root.color || '#3b82f6' }}
                      />
                      <span className="text-sm truncate">{root.title}</span>
                      {root.isEmergency && (
                        <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded border border-red-500/30">
                          اضطراری
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <span className="text-xs bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">
                        {root.contactsCount || 0}
                      </span>
                      <button
                        title="افزودن زیردسته"
                        onClick={() => handleOpenAddCategory(root._id)}
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-700 text-gray-400 hover:text-green-400"
                      >
                        +
                      </button>
                      <button
                        title="ویرایش"
                        onClick={() => handleOpenEditCategory(root)}
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-700 text-gray-400 hover:text-blue-400"
                      >
                        ✏️
                      </button>
                      <button
                        title="حذف"
                        onClick={() => handleDeleteCategory(root)}
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-700 text-gray-400 hover:text-red-400"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* Subcategories (Nested) */}
                  {subcats.length > 0 && (
                    <div className="bg-gray-900/40 pr-5 pl-2 py-1.5 space-y-1 border-t border-gray-800/40">
                      {subcats.map((sub) => {
                        const isSubSelected = selectedCategoryId === sub._id;
                        return (
                          <div
                            key={sub._id}
                            onClick={() => setSelectedCategoryId(sub._id)}
                            className={`p-2 rounded-lg flex items-center justify-between cursor-pointer transition text-xs ${
                              isSubSelected
                                ? 'bg-primary-600/30 text-white font-medium border border-primary-500/40'
                                : 'text-gray-400 hover:bg-gray-800/60 hover:text-gray-200'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-gray-500">↳</span>
                              <span className="truncate">{sub.title}</span>
                            </div>

                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <span className="bg-gray-800/90 text-gray-400 px-1.5 py-0.5 rounded text-[10px]">
                                {sub.contactsCount || 0}
                              </span>
                              <button
                                onClick={() => handleOpenEditCategory(sub)}
                                className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-700 text-gray-400"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(sub)}
                                className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-700 text-gray-400 hover:text-red-400"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Contacts Listing Panel (8 cols) */}
        <div className="lg:col-span-8 bg-gray-900/60 border border-gray-800/80 rounded-2xl p-5 shadow-lg flex flex-col h-[750px]">
          {/* Header & Search */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 pb-4 border-b border-gray-800">
            {/* Breadcrumb Trail */}
            <div className="flex items-center gap-1.5 text-xs text-gray-400 overflow-x-auto w-full md:w-auto">
              <span
                onClick={() => setSelectedCategoryId(null)}
                className="cursor-pointer hover:text-white transition"
              >
                همه مخاطبین
              </span>
              {breadcrumbTrail.map((b) => (
                <React.Fragment key={b._id}>
                  <span>/</span>
                  <span
                    onClick={() => setSelectedCategoryId(b._id)}
                    className="cursor-pointer hover:text-white font-medium text-gray-300 transition"
                  >
                    {b.title}
                  </span>
                </React.Fragment>
              ))}
            </div>

            {/* Search & Filters */}
            <div className="flex items-center gap-2.5 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <input
                  type="text"
                  placeholder="جستجوی نام، شماره، اداره..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              <button
                onClick={() => setFilterEmergency(!filterEmergency)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition flex items-center gap-1.5 shrink-0 ${
                  filterEmergency
                    ? 'bg-red-500/20 border-red-500 text-red-400'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200'
                }`}
              >
                <span>🚨</span>
                <span>فقط اضطراری</span>
              </button>
            </div>
          </div>

          {/* Contacts Table */}
          <div className="flex-1 overflow-y-auto mt-4 custom-scrollbar">
            {contactsLoading ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mb-2"></div>
                <span className="text-xs">در حال بارگذاری شماره‌ها...</span>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500 space-y-3">
                <span className="text-4xl">📭</span>
                <p className="text-sm">هیچ شماره تلفنی در این بخش یافت نشد</p>
                <button
                  onClick={handleOpenAddContact}
                  className="text-xs text-blue-400 hover:underline"
                >
                  افزودن اولین مخاطب
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredContacts.map((c) => {
                  const categoryName = typeof c.categoryId === 'object' ? c.categoryId?.title : '';
                  const categoryColor = typeof c.categoryId === 'object' ? c.categoryId?.color : '#3b82f6';

                  return (
                    <div
                      key={c._id}
                      className="bg-gray-800/40 hover:bg-gray-800/70 border border-gray-800 hover:border-gray-700 rounded-xl p-3.5 transition flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      {/* Left/Main Info */}
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{c.title}</span>
                          {c.isEmergency && (
                            <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded border border-red-500/30">
                              اضطراری
                            </span>
                          )}
                          {categoryName && (
                            <span
                              className="text-[11px] px-2 py-0.5 rounded-md border font-medium"
                              style={{
                                backgroundColor: `${categoryColor}15`,
                                borderColor: `${categoryColor}40`,
                                color: categoryColor,
                              }}
                            >
                              {categoryName}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                          {c.department && <span>🏢 {c.department}</span>}
                          {c.responsiblePerson && <span>👤 {c.responsiblePerson}</span>}
                          {c.city && <span>📍 {c.city}</span>}
                          {c.description && <span className="text-gray-500">({c.description})</span>}
                        </div>
                      </div>

                      {/* Phone & Actions */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-left font-mono">
                          <a
                            href={`tel:${c.phoneNumber}`}
                            className="text-sm font-bold text-blue-400 hover:text-blue-300 block"
                            dir="ltr"
                          >
                            {c.phoneNumber}
                          </a>
                          {c.internalNumber && (
                            <span className="text-[11px] text-gray-400 block" dir="rtl">
                              داخلی: {c.internalNumber}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 border-r border-gray-700 pr-3">
                          <button
                            onClick={() => handleOpenEditContact(c)}
                            className="p-1.5 rounded-lg bg-gray-700/50 hover:bg-blue-600/20 text-gray-300 hover:text-blue-400 text-xs transition"
                            title="ویرایش"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteContact(c)}
                            className="p-1.5 rounded-lg bg-gray-700/50 hover:bg-red-600/20 text-gray-300 hover:text-red-400 text-xs transition"
                            title="حذف"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL 1: Add/Edit Category */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6 shadow-2xl text-right">
            <h3 className="text-lg font-bold text-white mb-4">
              {editingCategory ? 'ویرایش دسته‌بندی' : 'دسته‌بندی جدید'}
            </h3>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  عنوان دسته‌بندی *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: استان خراسان رضوی یا مدارس منطقه ۵"
                  value={categoryForm.title}
                  onChange={(e) => setCategoryForm({ ...categoryForm, title: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  دسته‌بندی والد (اختیاری برای ساخت زیردسته)
                </label>
                <select
                  value={categoryForm.parentId}
                  onChange={(e) => setCategoryForm({ ...categoryForm, parentId: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">دسته‌بندی اصلی (بدون والد)</option>
                  {categories
                    .filter((c) => !editingCategory || c._id !== editingCategory._id)
                    .map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.title}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  توضیحات کوتاه
                </label>
                <textarea
                  rows={2}
                  placeholder="توضیح کوتاه درباره این بخش..."
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">رنگ شاخص</label>
                  <input
                    type="color"
                    value={categoryForm.color}
                    onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                    className="w-full h-10 rounded-xl cursor-pointer bg-gray-800 border border-gray-700 p-1"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="isEmergencyCat"
                    checked={categoryForm.isEmergency}
                    onChange={(e) =>
                      setCategoryForm({ ...categoryForm, isEmergency: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-red-600 focus:ring-red-500"
                  />
                  <label htmlFor="isEmergencyCat" className="text-xs text-red-400 font-medium">
                    دسته‌بندی اضطراری
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-medium transition"
                >
                  ذخیره دسته‌بندی
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Add/Edit Contact */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl text-right max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h3 className="text-lg font-bold text-white mb-4">
              {editingContact ? 'ویرایش شماره مخاطب' : 'افزودن مخاطب جدید'}
            </h3>

            <form onSubmit={handleSaveContact} className="space-y-3.5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    نام / عنوان مخاطب *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: اورژانس یا مدیر مدرسه"
                    value={contactForm.title}
                    onChange={(e) => setContactForm({ ...contactForm, title: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    شماره تلفن اصلی *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="021-xxxxxxxx یا 115"
                    dir="ltr"
                    value={contactForm.phoneNumber}
                    onChange={(e) => setContactForm({ ...contactForm, phoneNumber: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono text-right"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    شماره دوم / تلفن همراه
                  </label>
                  <input
                    type="text"
                    placeholder="0912xxxxxxx"
                    dir="ltr"
                    value={contactForm.phoneSecondary}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, phoneSecondary: e.target.value })
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono text-right"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">شماره داخلی</label>
                  <input
                    type="text"
                    placeholder="مثال: 104"
                    dir="ltr"
                    value={contactForm.internalNumber}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, internalNumber: e.target.value })
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono text-right"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">دسته‌بندی *</label>
                <select
                  required
                  value={contactForm.categoryId}
                  onChange={(e) => setContactForm({ ...contactForm, categoryId: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- انتخاب دسته‌بندی --</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.parentId ? `↳ ${c.title}` : c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">واحد / بخش</label>
                  <input
                    type="text"
                    placeholder="مثال: دبیرخانه یا آموزش ابتدایی"
                    value={contactForm.department}
                    onChange={(e) => setContactForm({ ...contactForm, department: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">نام مسئول</label>
                  <input
                    type="text"
                    placeholder="مثال: آقای دکتر حسینی"
                    value={contactForm.responsiblePerson}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, responsiblePerson: e.target.value })
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">شهر / استان</label>
                  <input
                    type="text"
                    placeholder="مثال: تهران یا اصفهان"
                    value={contactForm.city}
                    onChange={(e) => setContactForm({ ...contactForm, city: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="isEmergencyContact"
                    checked={contactForm.isEmergency}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, isEmergency: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-red-600 focus:ring-red-500"
                  />
                  <label htmlFor="isEmergencyContact" className="text-xs text-red-400 font-medium">
                    شماره اضطراری است
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">توضیحات</label>
                <textarea
                  rows={2}
                  placeholder="ساعت پاسخگویی، نشانی یا یادداشت..."
                  value={contactForm.description}
                  onChange={(e) => setContactForm({ ...contactForm, description: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowContactModal(false)}
                  className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-medium transition"
                >
                  ذخیره مخاطب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: JSON & Excel Batch Import */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-4xl p-6 shadow-2xl text-right max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>📥</span>
                <span>ورود گروهی مخاطبین دفترچه تلفن (JSON و Excel)</span>
              </h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-gray-400 hover:text-white text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-1">
              {/* Method Switch Tabs */}
              <div className="flex items-center gap-2 bg-gray-800/60 p-1 rounded-xl border border-gray-700/60 w-fit">
                <button
                  type="button"
                  onClick={() => setImportMode('file')}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
                    importMode === 'file'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  📁 انتخاب فایل (JSON یا اکسل)
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode('jsonText')}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
                    importMode === 'jsonText'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  📋 چسباندن متن کد JSON (Paste)
                </button>
              </div>

              {importMode === 'file' ? (
                /* File Dropzone */
                <div className="border-2 border-dashed border-gray-700 hover:border-emerald-500/50 rounded-2xl p-6 text-center bg-gray-800/30 transition">
                  <input
                    type="file"
                    id="phonebookFileInput"
                    accept=".json, .xlsx, .xls, .csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label htmlFor="phonebookFileInput" className="cursor-pointer space-y-2 block">
                    <div className="text-4xl">📄</div>
                    <p className="text-sm font-semibold text-gray-200">
                      برای انتخاب فایل JSON یا Excel کلیک کنید یا فایل را اینجا رها کنید
                    </p>
                    <p className="text-xs text-gray-400">
                      پشتیبانی کامل از فایل‌های <span className="font-mono text-emerald-400">.json</span> و همچنین <span className="font-mono text-blue-400">.xlsx, .xls, .csv</span>
                    </p>
                  </label>
                </div>
              ) : (
                /* JSON Direct Text Input */
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-300">
                      متن ساختار JSON را در کادر زیر قرار دهید:
                    </label>
                    <button
                      type="button"
                      onClick={handleParseJsonText}
                      className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
                    >
                      ⚡ پردازش و استخراج مخاطبین
                    </button>
                  </div>
                  <textarea
                    rows={8}
                    value={jsonInputText}
                    onChange={(e) => setJsonInputText(e.target.value)}
                    dir="ltr"
                    placeholder={`[
  {
    "title": "اداره کل آموزش و پرورش شهر تهران",
    "phoneNumber": "02188900000",
    "category": "ادارات کل آموزش و پرورش",
    "subcategory": "تهران",
    "department": "روابط عمومی",
    "city": "تهران"
  }
]`}
                    className="w-full bg-gray-950 font-mono text-xs text-gray-200 p-3 rounded-xl border border-gray-700 focus:border-blue-500 focus:outline-none custom-scrollbar"
                  />
                </div>
              )}

              {/* Optional Category Override */}
              <div className="bg-gray-800/40 p-3 rounded-xl border border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs text-gray-300">
                  دسته‌بندی پیش‌فرض (در صورت نبود دسته‌بندی در فایل یا متن JSON):
                </span>
                <select
                  value={importTargetCatId}
                  onChange={(e) => setImportTargetCatId(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                >
                  <option value="">تشخیص و ایجاد اتوماتیک از روی داده‌ها</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Preview Table */}
              {previewRows.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-400">
                        پیش‌نمایش مخاطبین شناسایی‌شده ({previewRows.length} مورد):
                      </span>
                    </div>
                    <button
                      onClick={() => setPreviewRows([])}
                      className="text-xs text-red-400 hover:underline"
                    >
                      پاک‌سازی لیست پیش‌نمایش
                    </button>
                  </div>

                  <div className="max-h-60 overflow-y-auto border border-gray-800 rounded-xl">
                    <table className="w-full text-xs text-right text-gray-300">
                      <thead className="bg-gray-800 text-gray-400 sticky top-0">
                        <tr>
                          <th className="p-2">#</th>
                          <th className="p-2">عنوان/نام واحد</th>
                          <th className="p-2">شماره تماس</th>
                          <th className="p-2">دسته‌بندی</th>
                          <th className="p-2">زیردسته/منطقه</th>
                          <th className="p-2">بخش/واحد</th>
                          <th className="p-2">شهر</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {previewRows.slice(0, 50).map((row, idx) => (
                          <tr key={idx} className="hover:bg-gray-800/30">
                            <td className="p-2 text-gray-500">{idx + 1}</td>
                            <td className="p-2 font-medium text-white">
                              {row['title'] || row['عنوان'] || row['نام'] || row['Title'] || row['name'] || '-'}
                            </td>
                            <td className="p-2 font-mono text-emerald-400 font-semibold" dir="ltr">
                              {row['phoneNumber'] || row['شماره'] || row['تلفن'] || row['شماره تماس'] || row['Phone'] || '-'}
                            </td>
                            <td className="p-2">
                              <span className="px-2 py-0.5 rounded bg-blue-900/40 text-blue-300 border border-blue-700/50 text-[11px]">
                                {row['category'] || row['دسته‌بندی'] || row['دسته'] || 'عمومی'}
                              </span>
                            </td>
                            <td className="p-2 text-gray-400">
                              {row['subcategory'] || row['زیردسته'] || '-'}
                            </td>
                            <td className="p-2 text-gray-400">
                              {row['department'] || row['واحد'] || row['بخش'] || '-'}
                            </td>
                            <td className="p-2 text-gray-400">
                              {row['city'] || row['شهر'] || row['استان'] || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {previewRows.length > 50 && (
                    <p className="text-[11px] text-gray-500 mt-1">
                      (۵۰ ردیف اول از مجموع {previewRows.length} شماره جهت پیش‌نمایش نشان داده شده است)
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-800 mt-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleDownloadSampleJson}
                  className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
                >
                  📥 دریافت نمونه فرمت JSON
                </button>
                <span className="text-gray-600">|</span>
                <button
                  type="button"
                  onClick={handleDownloadSampleExcel}
                  className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                >
                  📥 دریافت نمونه فرمت Excel
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition"
                >
                  انصراف
                </button>
                <button
                  onClick={handleConfirmImport}
                  disabled={previewRows.length === 0 || isImporting}
                  className={`px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-600/20 ${
                    previewRows.length === 0 || isImporting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isImporting ? 'در حال ثبت در پایگاه داده...' : `✅ تأیید و وارد کردن (${previewRows.length} مخاطب)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
