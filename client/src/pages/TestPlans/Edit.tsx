import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import PageMeta from '../../components/common/PageMeta';
import { ChevronDownIcon, PlusIcon, TrashBinIcon } from '../../icons';

// Test adımı tipi
interface TestStep {
  action: string;
  target?: string;
  strategy?: string;
  value?: string;
  description?: string;
  timeout?: number;
}

// Test planı tipi
interface TestPlan {
  id?: string;
  name: string;
  description: string;
  browserPreference: string;
  headless: boolean;
  steps: TestStep[];
}

// Kullanılabilir adım tipleri
const availableActions = [
  { value: 'navigate', label: 'Sayfaya Git', hasTarget: true, hasValue: false },
  { value: 'click', label: 'Tıkla', hasTarget: true, hasValue: false },
  { value: 'type', label: 'Yazı Yaz', hasTarget: true, hasValue: true },
  { value: 'select', label: 'Seçim Yap', hasTarget: true, hasValue: true },
  { value: 'check', label: 'İşaretle', hasTarget: true, hasValue: false },
  { value: 'uncheck', label: 'İşareti Kaldır', hasTarget: true, hasValue: false },
  { value: 'wait', label: 'Bekle', hasTarget: false, hasValue: true },
  { value: 'waitForElement', label: 'Element İçin Bekle', hasTarget: true, hasValue: false },
  { value: 'takeScreenshot', label: 'Ekran Görüntüsü Al', hasTarget: false, hasValue: true },
  { value: 'verifyText', label: 'Metni Doğrula', hasTarget: true, hasValue: true },
  { value: 'verifyElementExists', label: 'Element Varlığını Doğrula', hasTarget: true, hasValue: false }
];

// Kullanılabilir strateji tipleri
const availableStrategies = [
  { value: 'css', label: 'CSS Selector' },
  { value: 'xpath', label: 'XPath' },
  { value: 'id', label: 'ID' },
  { value: 'name', label: 'Name' },
  { value: 'text', label: 'Text' },
  { value: 'role', label: 'Role' }
];

// Örnek test planı
const sampleTestPlan: TestPlan = {
  id: '1',
  name: 'Login Test',
  description: 'Kullanıcı girişi testi',
  browserPreference: 'chromium',
  headless: true,
  steps: [
    {
      action: 'navigate',
      target: 'https://example.com/login',
      strategy: 'css',
      description: 'Login sayfasına git'
    },
    {
      action: 'type',
      target: '#username',
      strategy: 'css',
      value: 'testuser',
      description: 'Kullanıcı adını gir'
    },
    {
      action: 'type',
      target: '#password',
      strategy: 'css',
      value: 'password123',
      description: 'Şifreyi gir'
    },
    {
      action: 'click',
      target: 'button[type="submit"]',
      strategy: 'css',
      description: 'Giriş butonuna tıkla'
    },
    {
      action: 'waitForElement',
      target: '.dashboard',
      strategy: 'css',
      description: 'Dashboard sayfasının yüklenmesini bekle'
    }
  ]
};

const EditTestPlan: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [testPlan, setTestPlan] = useState<TestPlan>({
    name: '',
    description: '',
    browserPreference: 'chromium',
    headless: true,
    steps: []
  });
  const [currentStep, setCurrentStep] = useState<TestStep>({
    action: 'navigate',
    target: '',
    strategy: 'css',
    description: ''
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // API'den test planını getirme simülasyonu
    const fetchTestPlan = async () => {
      try {
        // Gerçek API çağrısı burada yapılacak
        // const response = await fetch(`http://localhost:3002/api/test-plans/${id}`);
        // const data = await response.json();
        
        // Şimdilik örnek veri kullanıyoruz
        setTimeout(() => {
          setTestPlan(sampleTestPlan);
          setLoading(false);
        }, 1000);
      } catch (err) {
        setError('Test planı yüklenirken bir hata oluştu.');
        setLoading(false);
        console.error(err);
      }
    };

    if (id) {
      fetchTestPlan();
    }
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTestPlan({
      ...testPlan,
      [name]: value
    });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setTestPlan({
      ...testPlan,
      [name]: checked
    });
  };

  const handleStepInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentStep({
      ...currentStep,
      [name]: value
    });
  };

  const handleAddStep = () => {
    // Adım eklemeden önce gerekli alanları kontrol et
    const selectedAction = availableActions.find(action => action.value === currentStep.action);
    
    if (!selectedAction) {
      setError('Geçersiz adım tipi.');
      return;
    }

    if (selectedAction.hasTarget && !currentStep.target) {
      setError('Hedef alanı gereklidir.');
      return;
    }

    if (selectedAction.hasValue && !currentStep.value) {
      setError('Değer alanı gereklidir.');
      return;
    }

    // Adımı ekle
    setTestPlan({
      ...testPlan,
      steps: [...testPlan.steps, { ...currentStep }]
    });

    // Adım formunu temizle
    setCurrentStep({
      action: 'navigate',
      target: '',
      strategy: 'css',
      description: ''
    });

    // Hata mesajını temizle
    setError(null);
  };

  const handleRemoveStep = (index: number) => {
    const updatedSteps = [...testPlan.steps];
    updatedSteps.splice(index, 1);
    setTestPlan({
      ...testPlan,
      steps: updatedSteps
    });
  };

  const handleUpdateTestPlan = async () => {
    // Form doğrulama
    if (!testPlan.name) {
      setError('Test planı adı gereklidir.');
      return;
    }

    if (testPlan.steps.length === 0) {
      setError('En az bir adım eklemelisiniz.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Gerçek API çağrısı burada yapılacak
      // await fetch(`http://localhost:3002/api/test-plans/${id}`, {
      //   method: 'PUT',
      //   headers: {
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify(testPlan)
      // });
      
      // Simülasyon
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Başarılı güncelleme sonrası test planları sayfasına yönlendir
      navigate('/test-plans');
    } catch (err) {
      setError('Test planı güncellenirken bir hata oluştu.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const getActionLabel = (actionValue: string) => {
    const action = availableActions.find(a => a.value === actionValue);
    return action ? action.label : actionValue;
  };

  const getStrategyLabel = (strategyValue: string) => {
    const strategy = availableStrategies.find(s => s.value === strategyValue);
    return strategy ? strategy.label : strategyValue;
  };

  return (
    <>
      <PageMeta
        title="Test Planını Düzenle | Playwright Server Agent"
        description="Test planını düzenleyin"
      />
      
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">
          Test Planını Düzenle
        </h2>
        <div className="flex gap-3">
          <Link
            to="/test-plans"
            className="inline-flex items-center justify-center gap-2.5 rounded-md border border-stroke py-2.5 px-5 text-center font-medium text-black hover:bg-gray-2 dark:border-strokedark dark:text-white dark:hover:bg-meta-4"
          >
            İptal
          </Link>
          <button
            onClick={handleUpdateTestPlan}
            className="inline-flex items-center justify-center gap-2.5 rounded-md bg-primary py-2.5 px-5 text-center font-medium text-white hover:bg-opacity-90"
            disabled={saving || loading}
          >
            {saving ? (
              <div className="flex items-center">
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></div>
                <span>Kaydediliyor...</span>
              </div>
            ) : (
              'Güncelle'
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex w-full rounded-lg border-l-6 border-[#F87171] bg-[#F87171]/[.15] px-7 py-5 shadow-md dark:bg-[#F87171]/[.15]">
          <div className="mr-5 flex h-9 w-9 items-center justify-center rounded-lg bg-[#F87171]">
            <svg
              width="19"
              height="16"
              viewBox="0 0 19 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1.50493 16H17.5023C18.6204 16 19.3413 14.9018 18.8354 13.9735L10.8367 0.770573C10.2852 -0.256858 8.70677 -0.256858 8.15528 0.770573L0.156617 13.9735C-0.334072 14.8998 0.386764 16 1.50493 16ZM10.7585 12.9298C10.7585 13.6155 10.2223 14.1433 9.45583 14.1433C8.6894 14.1433 8.15311 13.6155 8.15311 12.9298C8.15311 12.2441 8.6894 11.7163 9.45583 11.7163C10.2223 11.7163 10.7585 12.2441 10.7585 12.9298ZM8.75236 4.01062H10.2548C10.6674 4.01062 10.9127 4.33826 10.8671 4.75288L10.2071 10.1186C10.1615 10.5332 9.88572 10.7945 9.50142 10.7945C9.11929 10.7945 8.84138 10.5332 8.79579 10.1186L8.13574 4.75288C8.09449 4.33826 8.33984 4.01062 8.75236 4.01062Z"
                fill="white"
              />
            </svg>
          </div>
          <div className="w-full">
            <h5 className="mb-1 text-lg font-semibold text-[#B45454]">
              Hata
            </h5>
            <p className="text-base leading-relaxed text-[#CD5D5D]">
              {error}
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
              <h3 className="font-medium text-black dark:text-white">
                Test Planı Bilgileri
              </h3>
            </div>
            <div className="p-6.5">
              <div className="mb-4.5">
                <label className="mb-2.5 block text-black dark:text-white">
                  Test Planı Adı <span className="text-meta-1">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={testPlan.name}
                  onChange={handleInputChange}
                  placeholder="Test planı adı"
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              <div className="mb-4.5">
                <label className="mb-2.5 block text-black dark:text-white">
                  Açıklama
                </label>
                <textarea
                  name="description"
                  value={testPlan.description}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Test planı açıklaması"
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                ></textarea>
              </div>

              <div className="mb-4.5 grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2.5 block text-black dark:text-white">
                    Tarayıcı
                  </label>
                  <div className="relative z-20 bg-white dark:bg-form-input">
                    <select
                      name="browserPreference"
                      value={testPlan.browserPreference}
                      onChange={handleInputChange}
                      className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent py-3 px-5 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input"
                    >
                      <option value="chromium">Chromium</option>
                      <option value="firefox">Firefox</option>
                      <option value="edge">Edge</option>
                    </select>
                    <span className="absolute top-1/2 right-4 z-10 -translate-y-1/2">
                      <ChevronDownIcon className="w-5 h-5" />
                    </span>
                  </div>
                </div>

                <div>
                  <label className="mb-2.5 block text-black dark:text-white">
                    Headless Modu
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        name="headless"
                        checked={testPlan.headless}
                        onChange={handleCheckboxChange}
                        className="mr-2 h-5 w-5 cursor-pointer"
                      />
                      <span className="text-sm text-black dark:text-white">Headless (görünmez tarayıcı)</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
              <h3 className="font-medium text-black dark:text-white">
                Test Adımları
              </h3>
            </div>
            <div className="p-6.5">
              <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
                <div>
                  <label className="mb-2.5 block text-black dark:text-white">
                    Adım Tipi
                  </label>
                  <div className="relative z-20 bg-white dark:bg-form-input">
                    <select
                      name="action"
                      value={currentStep.action}
                      onChange={handleStepInputChange}
                      className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent py-3 px-5 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input"
                    >
                      {availableActions.map((action) => (
                        <option key={action.value} value={action.value}>
                          {action.label}
                        </option>
                      ))}
                    </select>
                    <span className="absolute top-1/2 right-4 z-10 -translate-y-1/2">
                      <ChevronDownIcon className="w-5 h-5" />
                    </span>
                  </div>
                </div>

                {availableActions.find(a => a.value === currentStep.action)?.hasTarget && (
                  <>
                    <div>
                      <label className="mb-2.5 block text-black dark:text-white">
                        Hedef
                      </label>
                      <input
                        type="text"
                        name="target"
                        value={currentStep.target || ''}
                        onChange={handleStepInputChange}
                        placeholder="Hedef element"
                        className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="mb-2.5 block text-black dark:text-white">
                        Strateji
                      </label>
                      <div className="relative z-20 bg-white dark:bg-form-input">
                        <select
                          name="strategy"
                          value={currentStep.strategy || 'css'}
                          onChange={handleStepInputChange}
                          className="relative z-20 w-full appearance-none rounded border border-stroke bg-transparent py-3 px-5 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input"
                        >
                          {availableStrategies.map((strategy) => (
                            <option key={strategy.value} value={strategy.value}>
                              {strategy.label}
                            </option>
                          ))}
                        </select>
                        <span className="absolute top-1/2 right-4 z-10 -translate-y-1/2">
                          <ChevronDownIcon className="w-5 h-5" />
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {availableActions.find(a => a.value === currentStep.action)?.hasValue && (
                  <div>
                    <label className="mb-2.5 block text-black dark:text-white">
                      Değer
                    </label>
                    <input
                      type="text"
                      name="value"
                      value={currentStep.value || ''}
                      onChange={handleStepInputChange}
                      placeholder="Değer"
                      className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    />
                  </div>
                )}
              </div>

              <div className="mb-6">
                <label className="mb-2.5 block text-black dark:text-white">
                  Adım Açıklaması
                </label>
                <input
                  type="text"
                  name="description"
                  value={currentStep.description || ''}
                  onChange={handleStepInputChange}
                  placeholder="Adım açıklaması"
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              <div className="mb-6">
                <button
                  onClick={handleAddStep}
                  className="inline-flex items-center justify-center gap-2.5 rounded-md bg-primary py-2.5 px-5 text-center font-medium text-white hover:bg-opacity-90"
                >
                  <PlusIcon className="w-5 h-5" />
                  Adım Ekle
                </button>
              </div>

              {testPlan.steps.length > 0 && (
                <div className="rounded-sm border border-stroke bg-white dark:border-strokedark dark:bg-boxdark">
                  <div className="max-w-full overflow-x-auto">
                    <table className="w-full table-auto">
                      <thead>
                        <tr className="bg-gray-2 text-left dark:bg-meta-4">
                          <th className="py-4 px-4 font-medium text-black dark:text-white">
                            #
                          </th>
                          <th className="py-4 px-4 font-medium text-black dark:text-white">
                            Adım Tipi
                          </th>
                          <th className="py-4 px-4 font-medium text-black dark:text-white">
                            Hedef
                          </th>
                          <th className="py-4 px-4 font-medium text-black dark:text-white">
                            Strateji
                          </th>
                          <th className="py-4 px-4 font-medium text-black dark:text-white">
                            Değer
                          </th>
                          <th className="py-4 px-4 font-medium text-black dark:text-white">
                            Açıklama
                          </th>
                          <th className="py-4 px-4 font-medium text-black dark:text-white">
                            İşlemler
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {testPlan.steps.map((step, index) => (
                          <tr key={index}>
                            <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                              <p className="text-black dark:text-white">{index + 1}</p>
                            </td>
                            <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                              <p className="text-black dark:text-white">{getActionLabel(step.action)}</p>
                            </td>
                            <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                              <p className="text-black dark:text-white">{step.target || '-'}</p>
                            </td>
                            <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                              <p className="text-black dark:text-white">{step.strategy ? getStrategyLabel(step.strategy) : '-'}</p>
                            </td>
                            <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                              <p className="text-black dark:text-white">{step.value || '-'}</p>
                            </td>
                            <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                              <p className="text-black dark:text-white">{step.description || '-'}</p>
                            </td>
                            <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                              <button
                                onClick={() => handleRemoveStep(index)}
                                className="hover:text-danger"
                              >
                                <TrashBinIcon className="w-5 h-5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default EditTestPlan;
