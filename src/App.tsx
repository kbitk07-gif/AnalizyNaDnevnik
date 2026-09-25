import { useState, useRef } from 'react';

interface ParsedValues {
  [key: string]: string;
}

function parseAnalyses(text: string): ParsedValues {
  const values: ParsedValues = {};
  
  // Разбиваем текст на блоки по "Подтверждено" или "Получение образца"
  const lines = text.split('\n');
  let currentName = '';
  let currentValue = '';
  let lineIndex = 0;
  
  while (lineIndex < lines.length) {
    const line = lines[lineIndex].trim();
    
    if (line === '' || line === 'Подтверждено' || line === 'Получение образца') {
      lineIndex++;
      continue;
    }
    
    // Это название показателя
    currentName = line;
    lineIndex++;
    
    // Пропускаем пустые строки
    while (lineIndex < lines.length && lines[lineIndex].trim() === '') {
      lineIndex++;
    }
    
    // Значение
    if (lineIndex < lines.length) {
      currentValue = lines[lineIndex].trim();
      lineIndex++;
    }
    
    // Пропускаем пустые строки
    while (lineIndex < lines.length && lines[lineIndex].trim() === '') {
      lineIndex++;
    }
    
    // Пропускаем референсные значения (строка с "-" или "<")
    if (lineIndex < lines.length) {
      const refLine = lines[lineIndex].trim();
      if (refLine.includes('-') || refLine.includes('<') || refLine === '') {
        lineIndex++;
      }
    }
    
    // Пропускаем единицы измерения
    while (lineIndex < lines.length && lines[lineIndex].trim() === '') {
      lineIndex++;
    }
    if (lineIndex < lines.length) {
      const unitLine = lines[lineIndex].trim();
      if (unitLine && unitLine !== 'Подтверждено' && unitLine !== 'Получение образца' && !unitLine.includes('-') && !unitLine.includes('<')) {
        // Это единица измерения, пропускаем
        lineIndex++;
      }
    }
    
    // Пропускаем до "Подтверждено" или "Получение образца"
    while (lineIndex < lines.length) {
      const l = lines[lineIndex].trim();
      if (l === 'Подтверждено' || l === 'Получение образца') {
        lineIndex++;
        break;
      }
      lineIndex++;
    }
    
    if (currentName && currentValue) {
      values[currentName] = currentValue;
    }
  }
  
  return values;
}

function formatOutput(values: ParsedValues): string {
  const get = (keys: string[]): string => {
    for (const key of keys) {
      if (values[key]) return values[key];
    }
    return '—';
  };

  const hb = get(['Гемоглобин']);
  const eritro = get(['Эритроциты']);
  const hematocrit = get(['Гематокрит']);
  const thrombo = get(['Тромбоциты']);
  const leuko = get(['Лейкоциты']);
  
  const glucose = get(['Глюкоза (сахар крови)', 'Глюкоза']);
  const creatinine = get(['Креатинин']);
  const urea = get(['Мочевина']);
  const bilirubinTotal = get(['Билирубин общий']);
  const bilirubinDirect = get(['Билирубин прямой']);
  const totalProtein = get(['Общий белок']);
  const ast = get(['Аспартатаминотрансфераза (АСТ)', 'АСТ']);
  const alt = get(['Аланинаминотрансфераза (АЛТ)', 'АЛТ']);
  const potassium = get(['Калий']);
  const sodium = get(['Натрий']);
  
  const fibrinogen = get(['Определение фибриногена в плазме крови на анализаторе', 'Фибриноген']);
  const aptt = get(['Определение активированного частичного тромбопластинового времени (АЧТВ) в плазме крови на анализато', 'АЧТВ']);
  const pt = get(['Протромбиновое время']);
  const inr = get(['МНО']);
  const pti = get(['Протромбиновый индекс']);

  let result = `Общий анализ крови: `;
  result += `Гемоглобин (Hb):${hb}г/л `;
  result += `Эритроциты:${eritro}×10¹²/л `;
  result += `Гематокрит (Нt):${hematocrit}% `;
  result += `Тромбоциты:${thrombo}×10⁹/л `;
  result += `Лейкоциты:${leuko}×10⁹/л `;
  
  result += `Биохимический анализ крови: `;
  result += `Глюкоза:${glucose}ммоль/л `;
  result += `Креатинин:${creatinine}мкмоль/л `;
  result += `Мочевина:${urea}ммоль/л `;
  result += `Билирубин общий:${bilirubinTotal}мкмоль/л `;
  result += `Билирубин прямой:${bilirubinDirect}мкмоль/л `;
  result += `Общий белок:${totalProtein}г/л `;
  result += `АСТ:${ast}Ед/л `;
  result += `АЛТ:${alt}Ед/л `;
  result += `Калий (К):${potassium}ммоль/л `;
  result += `Натрий (Na):${sodium}ммоль/л `;
  
  result += `Коагулограмма: `;
  result += `Фибриноген:${fibrinogen}г/л `;
  result += `АЧТВ:${aptt}секунд `;
  result += `Протромбиновое время (ПВ):${pt}секунд `;
  result += `МНО:${inr} `;
  result += `ПТИ:${pti}%`;

  return result;
}

function App() {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleParse = () => {
    const values = parseAnalyses(inputText);
    const result = formatOutput(values);
    setOutputText(result);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const target = event.target;
        if (target && target.result) {
          setImages(prev => [...prev, target.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    
    // Сбрасываем input чтобы можно было загрузить те же файлы снова
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleClear = () => {
    setInputText('');
    setOutputText('');
  };

  const handleClearImages = () => {
    setImages([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-indigo-800 mb-2">
            🩺 Анализатор анализов крови
          </h1>
          <p className="text-gray-600">
            Вставьте результаты анализов и получите форматированный вывод
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Input */}
          <div className="space-y-6">
            {/* Text Input Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-indigo-700 mb-4 flex items-center gap-2">
                📋 Текст анализов
              </h2>
              <textarea
                className="w-full h-64 p-4 border-2 border-indigo-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none text-sm font-mono"
                placeholder="Вставьте сюда результаты анализов..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleParse}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95"
                >
                  ⚡ Обработать
                </button>
                <button
                  onClick={handleClear}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-all"
                >
                  🗑️ Очистить
                </button>
              </div>
            </div>

            {/* Images Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-indigo-700 mb-4 flex items-center gap-2">
                📷 Фотографии
              </h2>
              <div 
                className="border-2 border-dashed border-indigo-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="text-4xl mb-2">📸</div>
                <p className="text-gray-500">Нажмите для загрузки фотографий</p>
                <p className="text-gray-400 text-sm mt-1">JPG, PNG, GIF</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
              
              {images.length > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-gray-600">Загружено: {images.length} фото</span>
                    <button
                      onClick={handleClearImages}
                      className="text-sm text-red-500 hover:text-red-700 transition-colors"
                    >
                      Удалить все
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {images.map((img, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={img}
                          alt={`Фото ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Output */}
          <div className="space-y-6">
            {/* Output Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-indigo-700 mb-4 flex items-center gap-2">
                📄 Результат
              </h2>
              {outputText ? (
                <>
                  <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 mb-4">
                    <p className="text-sm font-mono break-words leading-relaxed text-gray-800">
                      {outputText}
                    </p>
                  </div>
                  <button
                    onClick={handleCopy}
                    className={`w-full font-semibold py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 ${
                      copied 
                        ? 'bg-green-500 text-white' 
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    {copied ? '✅ Скопировано!' : '📋 Копировать результат'}
                  </button>
                </>
              ) : (
                <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
                  <div className="text-4xl mb-2">📝</div>
                  <p className="text-gray-400">
                    Результат появится здесь после обработки анализов
                  </p>
                </div>
              )}
            </div>

            {/* Template Info */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-indigo-700 mb-4 flex items-center gap-2">
                ℹ️ Формат вывода
              </h2>
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                <p className="text-xs font-mono text-indigo-800 leading-relaxed">
                  Общий анализ крови: Гемоглобин (Hb):[значение]г/л Эритроциты:[значение]×10¹²/л Гематокрит (Нt):[значение]% Тромбоциты:[значение]×10⁹/л Лейкоциты:[значение]×10⁹/л Биохимический анализ крови: Глюкоза:[значение]ммоль/л Креатинин:[значение]мкмоль/л Мочевина:[значение]ммоль/л Билирубин общий:[значение]мкмоль/л Билирубин прямой:[значение]мкмоль/л Общий белок:[значение]г/л АСТ:[значение]Ед/л АЛТ:[значение]Ед/л Калий (К):[значение]ммоль/л Натрий (Na):[значение]ммоль/л Коагулограмма: Фибриноген:[значение]г/л АЧТВ:[значение]секунд Протромбиновое время (ПВ):[значение]секунд МНО:[значение] ПТИ:[значение]%
                </p>
              </div>
            </div>

            {/* Parsed Values Preview */}
            {outputText && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-indigo-700 mb-4 flex items-center gap-2">
                  🔍 Распознанные значения
                </h2>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {(() => {
                    const values = parseAnalyses(inputText);
                    const displayNames = [
                      ['Гемоглобин', 'Гемоглобин'],
                      ['Эритроциты', 'Эритроциты'],
                      ['Гематокрит', 'Гематокрит'],
                      ['Тромбоциты', 'Тромбоциты'],
                      ['Лейкоциты', 'Лейкоциты'],
                      ['Глюкоза', 'Глюкоза (сахар крови)'],
                      ['Креатинин', 'Креатинин'],
                      ['Мочевина', 'Мочевина'],
                      ['Билирубин общий', 'Билирубин общий'],
                      ['Билирубин прямой', 'Билирубин прямой'],
                      ['Общий белок', 'Общий белок'],
                      ['АСТ', 'Аспартатаминотрансфераза (АСТ)'],
                      ['АЛТ', 'Аланинаминотрансфераза (АЛТ)'],
                      ['Калий', 'Калий'],
                      ['Натрий', 'Натрий'],
                      ['Фибриноген', 'Определение фибриногена в плазме крови на анализаторе'],
                      ['АЧТВ', 'Определение активированного частичного тромбопластинового времени (АЧТВ) в плазме крови на анализато'],
                      ['МНО', 'МНО'],
                      ['Протромбиновое время', 'Протромбиновое время'],
                      ['ПТИ', 'Протромбиновый индекс'],
                    ];
                    return displayNames.map(([short, full]) => (
                      <div key={short} className="flex justify-between bg-gray-50 rounded-lg px-3 py-2">
                        <span className="text-gray-600">{short}:</span>
                        <span className="font-semibold text-indigo-700">
                          {values[full] || '—'}
                        </span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
