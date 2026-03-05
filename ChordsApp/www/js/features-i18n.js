// ═══ Features Page i18n ═══
// Languages: EN, HE, RU, ES, FR, PT
(function () {
    const T = {
        en: {
            'nav.features': 'Features', 'nav.how': 'How It Works', 'nav.pricing': 'Pricing', 'nav.cta': 'Open App →',
            'hero.badge': 'AI-Powered Chord Sheet Manager',
            'hero.title': 'Turn any chord sheet into a clean, printable chart',
            'hero.subtitle': 'Upload a handwritten sheet or photo — AI detects chords, lyrics, key and sections. Transpose, format, print, and play live with your band. All in one app.',
            'hero.cta': "Get Started — It's Free", 'hero.pricing': 'See Pricing',
            'feat.title': 'Everything musicians need',
            'feat.sub': 'From scanning a handwritten chart to performing live on stage — aChordim covers every step.',
            'f1.title': 'AI-Powered Scanner', 'f1.desc': 'Upload a photo or PDF of any chord chart. Our AI (Google Gemini) detects chords, lyrics, key signature, sections, and layout direction — in any language.',
            'f2.title': 'Smart Visual Editor', 'f2.desc': 'Edit chords inline with ChordPro notation. Auto key detection, section markers (Verse, Chorus, Bridge), and smart formatting — all visually in real time.',
            'f3.title': 'Smart Transposition', 'f3.desc': 'Transpose by semitones or jump to any key instantly. Original baseline is preserved for accurate re-transposition. Handles bass notes correctly.',
            'f4.title': 'Display Modes', 'f4.desc': 'Switch between Chords, Nashville Numbers, Both, or Lyrics Only. Perfect for worship leaders, session musicians, and singers who each need different views.',
            'f5.title': 'Print & Export', 'f5.desc': 'A4 preview with adjustable font size, columns, line spacing, and character spacing. Print to paper or save as PNG image. Every print looks professional.',
            'f6.title': 'Metronome & Worship Pads', 'f6.desc': 'Built-in metronome with tap tempo, 7 time signatures, and sound types. Worship pads in all 12 keys with low-pass, high-pass, reverb, and panning effects.',
            'f7.title': 'Song Library & Books', 'f7.desc': 'Save songs with full metadata. Search, filter, organize into collections (Books). Bulk import from .txt, .cho, or .chordpro files. Share songs publicly.',
            'f8.title': 'Live Sessions', 'f8.desc': 'Create a session, share a 6-character code or QR. Leader controls song selection in real time — players follow automatically. Singer mode for lyrics-only views.',
            'f9.title': 'Live Performance Mode', 'f9.desc': 'Full-screen distraction-free view with auto-hiding controls. Section highlighting keeps the whole band in sync. MIDI controller support for hands-free navigation.',
            'f10.title': 'Shareable Playlists', 'f10.desc': 'Share your session playlist with anyone via a simple link. Recipients see all songs as printable A4 pages — no login required. Print the whole set in one go.',
            'how.title': 'From photo to stage in minutes', 'how.sub': 'Three key workflows that make aChordim indispensable.',
            'h1.title': 'Scan any chord chart', 'h1.p1': 'Take a photo of a handwritten or printed chord sheet. Our AI analyzes it in seconds — detecting chords, lyrics, key, BPM, time signature, and sections. Edit the result visually, then format it perfectly for print.', 'h1.p2': 'Supports Hebrew, English, Spanish, Portuguese, and any language with full RTL support.',
            'h2.title': 'Transpose & perform', 'h2.p1': 'Transpose to any key with one click. Choose between Chords, Nashville Numbers, or Both views. Enter Live Mode for full-screen performance with auto-hiding controls.', 'h2.p2': 'Your original chart is always preserved — transpose back anytime without losing quality.',
            'h3.title': 'Play live together', 'h3.p1': 'Create a session, share a code with your band. Everyone sees the same song in real time. Leaders control the setlist — band members follow automatically.', 'h3.p2': 'Share the entire playlist via link — anyone can view and print, no login required.',
            'price.title': 'Simple, fair pricing', 'price.sub': 'Start free. Upgrade when you need more.',
            'pr.t.free': 'Free', 'pr.t.basic': 'Basic', 'pr.t.pro': 'Pro', 'pr.t.book': 'Book',
            'pr.sub.forever': 'Forever', 'pr.sub.month': 'per month', 'pr.sub.once': 'one-time',
            'pr.btn.start': 'Get Started', 'pr.btn.sub': 'Subscribe', 'pr.btn.buy': 'Buy Once',
            'pr.li.scan3': '3 scans / month', 'pr.li.scan20': '20 scans / month', 'pr.li.scan50': '50 scans / month', 'pr.li.scan20inc': '20 scans included',
            'pr.li.trans': 'Transpose & Print', 'pr.li.metro': 'Metronome & Pads', 'pr.li.save': 'Save to Library', 'pr.li.nash': 'Nashville Numbers', 'pr.li.live': 'Live Sessions',
            'pr.li.search': 'Search & Collections', 'pr.li.join': 'Join Sessions', 'pr.li.create': 'Create Sessions',
            'pr.li.createlead': 'Create & Lead Sessions', 'pr.li.intense': 'Intense Scan Mode', 'pr.li.full': 'Full Library Access', 'pr.li.support': 'Priority Support', 'pr.li.buypacks': 'Buy scan packs',
            'cta.title': 'Ready to play?', 'cta.sub': 'Start scanning chord charts for free. No credit card required.', 'cta.btn': 'Open aChordim →',
            'ft.app': 'App', 'ft.privacy': 'Privacy', 'ft.terms': 'Terms',
        },
        he: {
            'nav.features': 'תכונות', 'nav.how': 'איך זה עובד', 'nav.pricing': 'מחירים', 'nav.cta': 'פתח אפליקציה ←',
            'hero.badge': 'מנהל דפי אקורדים מבוסס AI',
            'hero.title': 'הפוך כל דף אקורדים לתרשים נקי ומוכן להדפסה',
            'hero.subtitle': 'העלה דף בכתב יד או צילום — הבינה המלאכותית מזהה אקורדים, מילים, סולם ומקטעים. טרנספוז, עיצוב, הדפסה ונגינה חיה עם הלהקה. הכל באפליקציה אחת.',
            'hero.cta': 'התחל בחינם', 'hero.pricing': 'ראה מחירים',
            'feat.title': 'כל מה שמוזיקאים צריכים',
            'feat.sub': 'מסריקת דף אקורדים בכתב יד ועד להופעה חיה על הבמה — aChordim מכסה כל שלב.',
            'f1.title': 'סורק מבוסס AI', 'f1.desc': 'העלה צילום או PDF של כל דף אקורדים. הבינה המלאכותית שלנו (Google Gemini) מזהה אקורדים, מילים, סולם, מקטעים וכיוון פריסה — בכל שפה.',
            'f2.title': 'עורך חזותי חכם', 'f2.desc': 'ערוך אקורדים בשורה עם סימון ChordPro. זיהוי סולם אוטומטי, סמני מקטעים (בית, פזמון, גשר) ועיצוב חכם — הכל חזותית בזמן אמת.',
            'f3.title': 'טרנספוזיציה חכמה', 'f3.desc': 'טרנספוז בחצאי טונים או קפיצה לכל סולם מיידית. הבסיס המקורי נשמר לטרנספוזיציה מחדש מדויקת. מטפל בצלילי בס בצורה נכונה.',
            'f4.title': 'מצבי תצוגה', 'f4.desc': 'עבור בין אקורדים, מספרי Nashville, שניהם, או מילים בלבד. מושלם למנהיגי סגידה, מוזיקאי סשן וזמרים שכל אחד צריך תצוגה שונה.',
            'f5.title': 'הדפסה וייצוא', 'f5.desc': 'תצוגה מקדימה A4 עם גודל גופן מתכוונן, עמודות, מרווח שורות ומרווח תווים. הדפס לנייר או שמור כתמונת PNG. כל הדפסה נראית מקצועית.',
            'f6.title': 'מטרונום ופאדים', 'f6.desc': 'מטרונום מובנה עם Tap Tempo, 7 משקלים ו סוגי צליל. פאדים של סגידה ב-12 סולמות עם אפקטי Low-Pass, High-Pass, ריוורב ו-Panning.',
            'f7.title': 'ספריית שירים וספרים', 'f7.desc': 'שמור שירים עם מטא-דאטה מלא. חפש, סנן, ארגן באוספים (ספרים). ייבוא מרובה מקבצי .txt, .cho או .chordpro. שתף שירים באופן ציבורי.',
            'f8.title': 'סשנים חיים', 'f8.desc': 'צור סשן, שתף קוד בן 6 תווים או QR. המנהיג שולט בבחירת השיר בזמן אמת — הנגנים עוקבים אוטומטית. מצב זמר לתצוגת מילים בלבד.',
            'f9.title': 'מצב הופעה חיה', 'f9.desc': 'תצוגת מסך מלא ללא הסחות דעת עם פקדים שנעלמים אוטומטית. הדגשת מקטעים שומרת על כל הלהקה בסנכרון. תמיכה בבקר MIDI לניווט ללא ידיים.',
            'f10.title': 'פלייליסטים לשיתוף', 'f10.desc': 'שתף את הפלייליסט של הסשן עם כל אחד באמצעות קישור פשוט. הנמענים רואים את כל השירים כדפי A4 להדפסה — ללא צורך בהתחברות.',
            'how.title': 'מצילום לבמה בדקות', 'how.sub': 'שלושה תהליכי עבודה מרכזיים שהופכים את aChordim לבלתי נפרד.',
            'h1.title': 'סרוק כל דף אקורדים', 'h1.p1': 'צלם דף אקורדים בכתב יד או מודפס. הבינה המלאכותית שלנו מנתחת אותו בשניות — מזהה אקורדים, מילים, סולם, BPM, משקל ומקטעים. ערוך את התוצאה חזותית ועצב אותה בצורה מושלמת להדפסה.', 'h1.p2': 'תומך בעברית, אנגלית, ספרדית, פורטוגזית וכל שפה עם תמיכה מלאה ב-RTL.',
            'h2.title': 'טרנספוז ונגן', 'h2.p1': 'טרנספוז לכל סולם בלחיצה אחת. בחר בין אקורדים, מספרי Nashville, או שניהם. היכנס למצב הופעה למסך מלא עם פקדים שנעלמים אוטומטית.', 'h2.p2': 'התרשים המקורי שלך תמיד נשמר — טרנספוז בחזרה בכל עת ללא אובדן איכות.',
            'h3.title': 'נגנו ביחד בשידור חי', 'h3.p1': 'צור סשן, שתף קוד עם הלהקה שלך. כולם רואים את אותו שיר בזמן אמת. המנהיגים שולטים בסטליסט — חברי הלהקה עוקבים אוטומטית.', 'h3.p2': 'שתף את כל הפלייליסט באמצעות קישור — כל אחד יכול לצפות ולהדפיס, ללא צורך בהתחברות.',
            'price.title': 'תמחור פשוט והוגן', 'price.sub': 'התחל בחינם. שדרג כשאתה צריך יותר.',
            'pr.t.free': 'חינם', 'pr.t.basic': 'בסיסי', 'pr.t.pro': 'פרו', 'pr.t.book': 'ספר',
            'pr.sub.forever': 'לתמיד', 'pr.sub.month': 'לחודש', 'pr.sub.once': 'חד פעמי',
            'pr.btn.start': 'התחל עכשיו', 'pr.btn.sub': 'הירשם', 'pr.btn.buy': 'קנה פעם אחת',
            'pr.li.scan3': '3 סריקות / חודש', 'pr.li.scan20': '20 סריקות / חודש', 'pr.li.scan50': '50 סריקות / חודש', 'pr.li.scan20inc': '20 סריקות כלולות',
            'pr.li.trans': 'טרנספוזיציה והדפסה', 'pr.li.metro': 'מטרונום ופדים', 'pr.li.save': 'שמירה לספרייה', 'pr.li.nash': 'מספרי נאשוויל', 'pr.li.live': 'סשנים חיים',
            'pr.li.search': 'חיפוש ואוספים', 'pr.li.join': 'הצטרפות לסשנים', 'pr.li.create': 'יצירת סשנים',
            'pr.li.createlead': 'יצירה וניהול סשנים', 'pr.li.intense': 'סריקה חכמה מתקדמת', 'pr.li.full': 'גישה מלאה לספרייה', 'pr.li.support': 'תמיכה בעדיפות', 'pr.li.buypacks': 'קניית חבילות סריקה',
            'cta.title': 'מוכנים לנגן?', 'cta.sub': 'התחל לסרוק דפי אקורדים בחינם. לא צריך כרטיס אשראי.', 'cta.btn': '← פתח aChordim',
            'ft.app': 'אפליקציה', 'ft.privacy': 'פרטיות', 'ft.terms': 'תנאים',
        },
        ru: {
            'nav.features': 'Возможности', 'nav.how': 'Как это работает', 'nav.pricing': 'Цены', 'nav.cta': 'Открыть →',
            'hero.badge': 'Менеджер аккордовых листов на базе ИИ',
            'hero.title': 'Превратите любой лист аккордов в чистую, готовую к печати таблицу',
            'hero.subtitle': 'Загрузите рукописный лист или фото — ИИ определит аккорды, слова, тональность и разделы. Транспонируйте, форматируйте, печатайте и играйте вживую. Всё в одном приложении.',
            'hero.cta': 'Начать бесплатно', 'hero.pricing': 'Цены',
            'feat.title': 'Всё, что нужно музыкантам',
            'feat.sub': 'От сканирования рукописного листа до живого выступления — aChordim покрывает каждый шаг.',
            'f1.title': 'ИИ-сканер', 'f1.desc': 'Загрузите фото или PDF любого листа аккордов. Наш ИИ (Google Gemini) определяет аккорды, текст, тональность, разделы и направление — на любом языке.',
            'f2.title': 'Визуальный редактор', 'f2.desc': 'Редактируйте аккорды в формате ChordPro. Авто-определение тональности, маркеры разделов (Куплет, Припев, Бридж) и умное форматирование — всё визуально, в реальном времени.',
            'f3.title': 'Умная транспозиция', 'f3.desc': 'Транспонируйте по полутонам или перейдите в любую тональность мгновенно. Оригинал сохраняется для точной обратной транспозиции. Правильно обрабатывает басовые ноты.',
            'f4.title': 'Режимы отображения', 'f4.desc': 'Переключайте между аккордами, числами Nashville, обоими или только текстом. Идеально для лидеров прославления, сессионных музыкантов и вокалистов.',
            'f5.title': 'Печать и экспорт', 'f5.desc': 'Предпросмотр A4 с настраиваемым размером шрифта, колонками, межстрочным интервалом и межсимвольным интервалом. Печатайте или сохраняйте как PNG.',
            'f6.title': 'Метроном и пэды', 'f6.desc': 'Встроенный метроном с Tap Tempo, 7 размерами и типами звука. Пэды прославления во всех 12 тональностях с эффектами фильтров, реверба и панорамы.',
            'f7.title': 'Библиотека песен', 'f7.desc': 'Сохраняйте песни с метаданными. Поиск, фильтрация, коллекции. Массовый импорт из .txt, .cho или .chordpro файлов. Делитесь публично.',
            'f8.title': 'Живые сессии', 'f8.desc': 'Создайте сессию, поделитесь 6-значным кодом или QR. Лидер управляет выбором песен в реальном времени — участники следят автоматически. Режим вокалиста.',
            'f9.title': 'Режим выступления', 'f9.desc': 'Полноэкранный вид без отвлечений с автоскрытием элементов. Подсветка разделов синхронизирует всю группу. Поддержка MIDI-контроллера.',
            'f10.title': 'Общие плейлисты', 'f10.desc': 'Поделитесь плейлистом сессии по ссылке. Получатели видят все песни как страницы A4 — без входа. Печатайте весь сет за раз.',
            'how.title': 'От фото до сцены за минуты', 'how.sub': 'Три ключевых процесса, делающих aChordim незаменимым.',
            'h1.title': 'Сканируй любой лист', 'h1.p1': 'Сфотографируйте рукописный или печатный лист аккордов. Наш ИИ анализирует за секунды — определяя аккорды, текст, тональность, BPM, размер и разделы. Отредактируйте визуально и отформатируйте для печати.', 'h1.p2': 'Поддерживает иврит, английский, испанский, португальский и любой язык с полной поддержкой RTL.',
            'h2.title': 'Транспонируй и играй', 'h2.p1': 'Транспонируйте в любую тональность одним кликом. Выберите между аккордами, числами Nashville или обоими. Войдите в режим выступления для полноэкранной игры.', 'h2.p2': 'Ваш оригинал всегда сохраняется — транспонируйте обратно в любое время.',
            'h3.title': 'Играйте вместе вживую', 'h3.p1': 'Создайте сессию, поделитесь кодом с группой. Все видят одну песню в реальном времени. Лидер управляет сетлистом — участники следят автоматически.', 'h3.p2': 'Поделитесь плейлистом по ссылке — любой может смотреть и печатать без входа.',
            'price.title': 'Простые и честные цены', 'price.sub': 'Начните бесплатно. Обновляйтесь когда нужно.',
            'pr.t.free': 'Бесплатно', 'pr.t.basic': 'Базовый', 'pr.t.pro': 'Про', 'pr.t.book': 'Книга',
            'pr.sub.forever': 'Навсегда', 'pr.sub.month': 'в месяц', 'pr.sub.once': 'одноразово',
            'pr.btn.start': 'Начать', 'pr.btn.sub': 'Подписаться', 'pr.btn.buy': 'Купить раз',
            'pr.li.scan3': '3 скана / месяц', 'pr.li.scan20': '20 сканов / месяц', 'pr.li.scan50': '50 сканов / месяц', 'pr.li.scan20inc': 'Включено 20 сканов',
            'pr.li.trans': 'Транспонирование и печать', 'pr.li.metro': 'Метроном и пэды', 'pr.li.save': 'Сохранение в библиотеку', 'pr.li.nash': 'Нэшвиллская система', 'pr.li.live': 'Живые сессии',
            'pr.li.search': 'Поиск и коллекции', 'pr.li.join': 'Присоединение к сессиям', 'pr.li.create': 'Создание сессий',
            'pr.li.createlead': 'Создание и ведение сессий', 'pr.li.intense': 'Режим глубокого сканирования', 'pr.li.full': 'Полный доступ к библиотеке', 'pr.li.support': 'Приоритетная поддержка', 'pr.li.buypacks': 'Покупка пакетов сканирования',
            'cta.title': 'Готовы играть?', 'cta.sub': 'Начните сканировать листы аккордов бесплатно. Карта не нужна.', 'cta.btn': 'Открыть aChordim →',
            'ft.app': 'Приложение', 'ft.privacy': 'Конфиденциальность', 'ft.terms': 'Условия',
        },
        es: {
            'nav.features': 'Funciones', 'nav.how': 'Cómo funciona', 'nav.pricing': 'Precios', 'nav.cta': 'Abrir App →',
            'hero.badge': 'Gestor de hojas de acordes con IA',
            'hero.title': 'Convierte cualquier hoja de acordes en un gráfico limpio e imprimible',
            'hero.subtitle': 'Sube una hoja manuscrita o una foto — la IA detecta acordes, letras, tonalidad y secciones. Transpón, formatea, imprime y toca en vivo con tu banda. Todo en una app.',
            'hero.cta': 'Empezar gratis', 'hero.pricing': 'Ver precios',
            'feat.title': 'Todo lo que los músicos necesitan',
            'feat.sub': 'Desde escanear una hoja manuscrita hasta actuar en vivo — aChordim cubre cada paso.',
            'f1.title': 'Escáner con IA', 'f1.desc': 'Sube una foto o PDF de cualquier hoja de acordes. Nuestra IA (Google Gemini) detecta acordes, letras, tonalidad, secciones y dirección — en cualquier idioma.',
            'f2.title': 'Editor visual inteligente', 'f2.desc': 'Edita acordes en línea con notación ChordPro. Detección automática de tonalidad, marcadores de sección (Verso, Coro, Puente) y formato inteligente — todo visualmente en tiempo real.',
            'f3.title': 'Transposición inteligente', 'f3.desc': 'Transpón por semitonos o salta a cualquier tonalidad al instante. La línea base original se preserva para re-transposición precisa.',
            'f4.title': 'Modos de visualización', 'f4.desc': 'Cambia entre Acordes, Números Nashville, Ambos, o Solo Letras. Perfecto para líderes de alabanza, músicos de sesión y cantantes.',
            'f5.title': 'Imprimir y exportar', 'f5.desc': 'Vista previa A4 con tamaño de fuente, columnas, espaciado de líneas y caracteres ajustables. Imprime en papel o guarda como imagen PNG.',
            'f6.title': 'Metrónomo y pads', 'f6.desc': 'Metrónomo incorporado con Tap Tempo, 7 compases y tipos de sonido. Pads de alabanza en las 12 tonalidades con efectos de filtro, reverb y paneo.',
            'f7.title': 'Biblioteca de canciones', 'f7.desc': 'Guarda canciones con metadatos completos. Busca, filtra, organiza en colecciones (Libros). Importación masiva desde archivos .txt, .cho o .chordpro.',
            'f8.title': 'Sesiones en vivo', 'f8.desc': 'Crea una sesión, comparte un código de 6 caracteres o QR. El líder controla la selección de canciones en tiempo real — los músicos siguen automáticamente.',
            'f9.title': 'Modo de actuación', 'f9.desc': 'Vista de pantalla completa sin distracciones. El resaltado de secciones mantiene a toda la banda sincronizada. Soporte para controlador MIDI.',
            'f10.title': 'Listas compartibles', 'f10.desc': 'Comparte la lista de la sesión con un enlace simple. Los destinatarios ven todas las canciones como páginas A4 — sin necesidad de iniciar sesión.',
            'how.title': 'De la foto al escenario en minutos', 'how.sub': 'Tres flujos de trabajo clave que hacen a aChordim indispensable.',
            'h1.title': 'Escanea cualquier hoja', 'h1.p1': 'Toma una foto de una hoja de acordes. Nuestra IA la analiza en segundos — detectando acordes, letras, tonalidad, BPM, compás y secciones. Edita visualmente y formatea para imprimir.', 'h1.p2': 'Soporta hebreo, inglés, español, portugués y cualquier idioma con soporte RTL completo.',
            'h2.title': 'Transpón y toca', 'h2.p1': 'Transpón a cualquier tonalidad con un clic. Elige entre Acordes, Nashville o Ambos. Entra en Modo Live para actuación a pantalla completa.', 'h2.p2': 'Tu hoja original siempre se preserva — transpón de vuelta en cualquier momento.',
            'h3.title': 'Toca en vivo juntos', 'h3.p1': 'Crea una sesión, comparte un código con tu banda. Todos ven la misma canción en tiempo real. Los líderes controlan el setlist — los músicos siguen automáticamente.', 'h3.p2': 'Comparte toda la lista por enlace — cualquiera puede ver e imprimir, sin login.',
            'price.title': 'Precios simples y justos', 'price.sub': 'Empieza gratis. Mejora cuando necesites más.',
            'pr.t.free': 'Gratis', 'pr.t.basic': 'Básico', 'pr.t.pro': 'Pro', 'pr.t.book': 'Libro',
            'pr.sub.forever': 'Para siempre', 'pr.sub.month': 'por mes', 'pr.sub.once': 'una vez',
            'pr.btn.start': 'Empezar', 'pr.btn.sub': 'Suscribirse', 'pr.btn.buy': 'Comprar una vez',
            'pr.li.scan3': '3 escaneos / mes', 'pr.li.scan20': '20 escaneos / mes', 'pr.li.scan50': '50 escaneos / mes', 'pr.li.scan20inc': '20 escaneos incluidos',
            'pr.li.trans': 'Transponer e imprimir', 'pr.li.metro': 'Metrónomo y Pads', 'pr.li.save': 'Guardar en biblioteca', 'pr.li.nash': 'Números de Nashville', 'pr.li.live': 'Sesiones en vivo',
            'pr.li.search': 'Búsqueda y colecciones', 'pr.li.join': 'Unirse a sesiones', 'pr.li.create': 'Crear sesiones',
            'pr.li.createlead': 'Crear y liderar sesiones', 'pr.li.intense': 'Escaneo intenso', 'pr.li.full': 'Acceso total a la biblioteca', 'pr.li.support': 'Soporte prioritario', 'pr.li.buypacks': 'Comprar paquetes de escaneo',
            'cta.title': '¿Listo para tocar?', 'cta.sub': 'Empieza a escanear hojas de acordes gratis. Sin tarjeta de crédito.', 'cta.btn': 'Abrir aChordim →',
            'ft.app': 'App', 'ft.privacy': 'Privacidad', 'ft.terms': 'Términos',
        },
        fr: {
            'nav.features': 'Fonctionnalités', 'nav.how': 'Comment ça marche', 'nav.pricing': 'Tarifs', 'nav.cta': 'Ouvrir l\'app →',
            'hero.badge': 'Gestionnaire de feuilles d\'accords propulsé par l\'IA',
            'hero.title': 'Transformez toute feuille d\'accords en un tableau propre et imprimable',
            'hero.subtitle': 'Téléchargez une feuille manuscrite ou une photo — l\'IA détecte les accords, paroles, tonalité et sections. Transposez, formatez, imprimez et jouez en live. Tout en une seule app.',
            'hero.cta': 'Commencer gratuitement', 'hero.pricing': 'Voir les tarifs',
            'feat.title': 'Tout ce dont les musiciens ont besoin',
            'feat.sub': 'De la numérisation d\'une feuille manuscrite à la performance live — aChordim couvre chaque étape.',
            'f1.title': 'Scanner IA', 'f1.desc': 'Téléchargez une photo ou PDF de toute feuille d\'accords. Notre IA (Google Gemini) détecte les accords, paroles, tonalité, sections et direction — dans toutes les langues.',
            'f2.title': 'Éditeur visuel intelligent', 'f2.desc': 'Éditez les accords avec la notation ChordPro. Détection automatique de tonalité, marqueurs de section (Couplet, Refrain, Pont) et mise en forme intelligente — en temps réel.',
            'f3.title': 'Transposition intelligente', 'f3.desc': 'Transposez par demi-tons ou sautez à n\'importe quelle tonalité. La base originale est préservée pour une re-transposition précise.',
            'f4.title': 'Modes d\'affichage', 'f4.desc': 'Basculez entre Accords, Numéros Nashville, Les deux, ou Paroles seules. Parfait pour les leaders de louange, musiciens de session et chanteurs.',
            'f5.title': 'Impression et export', 'f5.desc': 'Aperçu A4 avec taille de police, colonnes, espacement des lignes et des caractères réglables. Imprimez ou sauvegardez en PNG.',
            'f6.title': 'Métronome et pads', 'f6.desc': 'Métronome intégré avec Tap Tempo, 7 signatures de temps et types de sons. Pads de louange dans les 12 tonalités avec effets de filtre, réverbe et panoramique.',
            'f7.title': 'Bibliothèque de chansons', 'f7.desc': 'Sauvegardez des chansons avec métadonnées complètes. Recherchez, filtrez, organisez en collections (Livres). Import en masse depuis fichiers .txt, .cho ou .chordpro.',
            'f8.title': 'Sessions en direct', 'f8.desc': 'Créez une session, partagez un code à 6 caractères ou QR. Le leader contrôle la sélection en temps réel — les musiciens suivent automatiquement.',
            'f9.title': 'Mode performance', 'f9.desc': 'Vue plein écran sans distractions. La mise en surbrillance des sections synchronise tout le groupe. Support contrôleur MIDI.',
            'f10.title': 'Playlists partageables', 'f10.desc': 'Partagez la playlist de session via un simple lien. Les destinataires voient toutes les chansons en pages A4 — sans connexion requise.',
            'how.title': 'De la photo à la scène en minutes', 'how.sub': 'Trois processus clés qui rendent aChordim indispensable.',
            'h1.title': 'Scannez toute feuille', 'h1.p1': 'Prenez une photo d\'une feuille d\'accords. Notre IA l\'analyse en secondes — détectant accords, paroles, tonalité, BPM, mesure et sections. Éditez visuellement puis formatez pour l\'impression.', 'h1.p2': 'Supporte l\'hébreu, l\'anglais, l\'espagnol, le portugais et toute langue avec support RTL complet.',
            'h2.title': 'Transposez et jouez', 'h2.p1': 'Transposez dans n\'importe quelle tonalité en un clic. Choisissez entre Accords, Nashville ou Les deux. Entrez en Mode Live pour une performance plein écran.', 'h2.p2': 'Votre feuille originale est toujours préservée — retransposez à tout moment.',
            'h3.title': 'Jouez ensemble en live', 'h3.p1': 'Créez une session, partagez un code avec votre groupe. Tous voient la même chanson en temps réel. Les leaders contrôlent la setlist — les musiciens suivent automatiquement.', 'h3.p2': 'Partagez toute la playlist via un lien — chacun peut voir et imprimer, sans connexion.',
            'price.title': 'Tarifs simples et justes', 'price.sub': 'Commencez gratuitement. Évoluez selon vos besoins.',
            'pr.t.free': 'Gratuit', 'pr.t.basic': 'Basique', 'pr.t.pro': 'Pro', 'pr.t.book': 'Livre',
            'pr.sub.forever': 'Pour toujours', 'pr.sub.month': 'par mois', 'pr.sub.once': 'une fois',
            'pr.btn.start': 'Commencer', 'pr.btn.sub': 'S\'abonner', 'pr.btn.buy': 'Acheter une fois',
            'pr.li.scan3': '3 scans / mois', 'pr.li.scan20': '20 scans / mois', 'pr.li.scan50': '50 scans / mois', 'pr.li.scan20inc': '20 scans inclus',
            'pr.li.trans': 'Transposer et imprimer', 'pr.li.metro': 'Métronome et Pads', 'pr.li.save': 'Enregistrer', 'pr.li.nash': 'Système Nashville', 'pr.li.live': 'Sessions en direct',
            'pr.li.search': 'Recherche et collections', 'pr.li.join': 'Rejoindre des sessions', 'pr.li.create': 'Créer des sessions',
            'pr.li.createlead': 'Créer et diriger des sessions', 'pr.li.intense': 'Scan intensif', 'pr.li.full': 'Accès total', 'pr.li.support': 'Support prioritaire', 'pr.li.buypacks': 'Acheter des scans',
            'cta.title': 'Prêt à jouer ?', 'cta.sub': 'Commencez à scanner des feuilles d\'accords gratuitement. Sans carte bancaire.', 'cta.btn': 'Ouvrir aChordim →',
            'ft.app': 'App', 'ft.privacy': 'Confidentialité', 'ft.terms': 'Conditions',
        },
        pt: {
            'nav.features': 'Recursos', 'nav.how': 'Como funciona', 'nav.pricing': 'Preços', 'nav.cta': 'Abrir App →',
            'hero.badge': 'Gerenciador de cifras com IA',
            'hero.title': 'Transforme qualquer cifra em um gráfico limpo e pronto para imprimir',
            'hero.subtitle': 'Envie uma folha manuscrita ou foto — a IA detecta acordes, letras, tom e seções. Transponha, formate, imprima e toque ao vivo com sua banda. Tudo em um app.',
            'hero.cta': 'Começar grátis', 'hero.pricing': 'Ver preços',
            'feat.title': 'Tudo que músicos precisam',
            'feat.sub': 'Da digitalização de uma cifra manuscrita à performance ao vivo — aChordim cobre cada etapa.',
            'f1.title': 'Scanner com IA', 'f1.desc': 'Envie uma foto ou PDF de qualquer cifra. Nossa IA (Google Gemini) detecta acordes, letras, tom, seções e direção — em qualquer idioma.',
            'f2.title': 'Editor visual inteligente', 'f2.desc': 'Edite acordes com notação ChordPro. Detecção automática de tom, marcadores de seção (Verso, Refrão, Ponte) e formatação inteligente — tudo visualmente em tempo real.',
            'f3.title': 'Transposição inteligente', 'f3.desc': 'Transponha por semitons ou pule para qualquer tom instantaneamente. A base original é preservada para re-transposição precisa.',
            'f4.title': 'Modos de exibição', 'f4.desc': 'Alterne entre Acordes, Números Nashville, Ambos ou Só Letras. Perfeito para líderes de louvor, músicos de sessão e cantores.',
            'f5.title': 'Imprimir e exportar', 'f5.desc': 'Prévia A4 com tamanho de fonte, colunas, espaçamento de linhas e caracteres ajustáveis. Imprima em papel ou salve como PNG.',
            'f6.title': 'Metrônomo e pads', 'f6.desc': 'Metrônomo integrado com Tap Tempo, 7 compassos e tipos de som. Pads de louvor em todos os 12 tons com efeitos de filtro, reverb e panorama.',
            'f7.title': 'Biblioteca de músicas', 'f7.desc': 'Salve músicas com metadados completos. Pesquise, filtre, organize em coleções (Livros). Importação em massa de arquivos .txt, .cho ou .chordpro.',
            'f8.title': 'Sessões ao vivo', 'f8.desc': 'Crie uma sessão, compartilhe um código de 6 caracteres ou QR. O líder controla a seleção de músicas em tempo real — músicos seguem automaticamente.',
            'f9.title': 'Modo performance', 'f9.desc': 'Tela cheia sem distrações. O destaque de seções mantém toda a banda sincronizada. Suporte para controlador MIDI.',
            'f10.title': 'Playlists compartilháveis', 'f10.desc': 'Compartilhe a playlist da sessão com um link simples. Destinatários veem todas as músicas como páginas A4 — sem login necessário.',
            'how.title': 'Da foto ao palco em minutos', 'how.sub': 'Três fluxos de trabalho que tornam o aChordim indispensável.',
            'h1.title': 'Digitalize qualquer cifra', 'h1.p1': 'Tire uma foto de uma cifra. Nossa IA analisa em segundos — detectando acordes, letras, tom, BPM, compasso e seções. Edite visualmente e formate para impressão.', 'h1.p2': 'Suporta hebraico, inglês, espanhol, português e qualquer idioma com suporte RTL completo.',
            'h2.title': 'Transponha e toque', 'h2.p1': 'Transponha para qualquer tom com um clique. Escolha entre Acordes, Nashville ou Ambos. Entre no Modo Live para performance em tela cheia.', 'h2.p2': 'Sua cifra original é sempre preservada — transponha de volta a qualquer momento.',
            'h3.title': 'Toquem juntos ao vivo', 'h3.p1': 'Crie uma sessão, compartilhe um código com sua banda. Todos veem a mesma música em tempo real. Líderes controlam o setlist — músicos seguem automaticamente.', 'h3.p2': 'Compartilhe toda a playlist por link — qualquer pessoa pode ver e imprimir, sem login.',
            'price.title': 'Preços simples e justos', 'price.sub': 'Comece grátis. Atualize quando precisar.',
            'pr.t.free': 'Grátis', 'pr.t.basic': 'Básico', 'pr.t.pro': 'Pro', 'pr.t.book': 'Livro',
            'pr.sub.forever': 'Para sempre', 'pr.sub.month': 'por mês', 'pr.sub.once': 'uma vez',
            'pr.btn.start': 'Começar', 'pr.btn.sub': 'Assinar', 'pr.btn.buy': 'Comprar uma vez',
            'pr.li.scan3': '3 scans / mês', 'pr.li.scan20': '20 scans / mês', 'pr.li.scan50': '50 scans / mês', 'pr.li.scan20inc': '20 scans inclusos',
            'pr.li.trans': 'Transpor e Imprimir', 'pr.li.metro': 'Metrônomo e Pads', 'pr.li.save': 'Salvar na biblioteca', 'pr.li.nash': 'Números Nashville', 'pr.li.live': 'Sessões ao vivo',
            'pr.li.search': 'Pesquisa e coleções', 'pr.li.join': 'Participar de sessões', 'pr.li.create': 'Criar sessões',
            'pr.li.createlead': 'Criar e liderar sessões', 'pr.li.intense': 'Modo de scan intenso', 'pr.li.full': 'Acesso total', 'pr.li.support': 'Suporte prioritário', 'pr.li.buypacks': 'Comprar pacotes de scan',
            'cta.title': 'Pronto para tocar?', 'cta.sub': 'Comece a digitalizar cifras grátis. Sem cartão de crédito.', 'cta.btn': 'Abrir aChordim →',
            'ft.app': 'App', 'ft.privacy': 'Privacidade', 'ft.terms': 'Termos',
        }
    };

    const langNames = { en: 'EN', he: 'HE', ru: 'RU', es: 'ES', fr: 'FR', pt: 'PT' };
    const rtlLangs = ['he'];
    let currentLang = 'en';

    function applyLang(lang) {
        if (!T[lang]) lang = 'en';
        currentLang = lang;
        const dict = T[lang];

        // Apply text to all data-i18n elements
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (dict[key]) el.textContent = dict[key];
        });

        // Handle "Most Popular" badge on pricing card
        const popularCard = document.querySelector('.pricing-card.popular');
        if (popularCard) {
            const badges = { en: 'Most Popular', he: 'הכי פופולרי', ru: 'Популярный', es: 'Más popular', fr: 'Le plus populaire', pt: 'Mais popular' };
            popularCard.style.setProperty('--popular-text', `"${badges[lang] || badges.en}"`);
            // Update the ::before pseudo-element via a style tag
            let styleEl = document.getElementById('popular-badge-style');
            if (!styleEl) { styleEl = document.createElement('style'); styleEl.id = 'popular-badge-style'; document.head.appendChild(styleEl); }
            styleEl.textContent = `.pricing-card.popular::before { content: "${badges[lang] || badges.en}"; }`;
        }

        // RTL
        const isRTL = rtlLangs.includes(lang);
        document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;

        // Update button label
        const btn = document.getElementById('langBtn');
        if (btn) btn.textContent = `${langNames[lang]} ▾`;

        // Update active state in dropdown
        document.querySelectorAll('.lang-option').forEach(o => {
            o.classList.toggle('active', o.dataset.lang === lang);
        });

        localStorage.setItem('features-lang', lang);
    }

    // Dropdown toggle
    document.getElementById('langBtn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('langDropdown')?.classList.toggle('open');
    });

    // Language selection
    document.querySelectorAll('.lang-option').forEach(opt => {
        opt.addEventListener('click', () => {
            applyLang(opt.dataset.lang);
            document.getElementById('langDropdown')?.classList.remove('open');
        });
    });

    // Close dropdown on outside click
    document.addEventListener('click', () => {
        document.getElementById('langDropdown')?.classList.remove('open');
    });

    // Initialize: check saved preference, then browser language
    const saved = localStorage.getItem('features-lang');
    if (saved && T[saved]) {
        applyLang(saved);
    } else {
        const browserLang = (navigator.language || '').slice(0, 2).toLowerCase();
        applyLang(T[browserLang] ? browserLang : 'en');
    }
})();
