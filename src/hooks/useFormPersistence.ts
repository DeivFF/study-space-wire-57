
import { useCallback, useEffect, useRef } from 'react';
import { useSessionStorage } from '@/hooks/useLocalStorage';

export interface FormPersistenceConfig {
  formId: string;
  fields: string[];
  debounceMs?: number;
  clearOnSubmit?: boolean;
}

export function useFormPersistence(config: FormPersistenceConfig) {
  const { formId, fields, debounceMs = 500, clearOnSubmit = true } = config;
  const [formData, setFormData] = useSessionStorage(`form-${formId}`, {});
  const debounceRef = useRef<NodeJS.Timeout>();
  const formRef = useRef<HTMLFormElement>(null);

  const saveFieldValue = useCallback((fieldName: string, value: any) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      setFormData(prev => ({
        ...prev,
        [fieldName]: value
      }));
    }, debounceMs);
  }, [setFormData, debounceMs]);

  const restoreFormData = useCallback(() => {
    if (!formRef.current || !formData) return;

    const form = formRef.current;
    fields.forEach(fieldName => {
      const field = form.querySelector(`[name="${fieldName}"]`) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      if (field && formData[fieldName] !== undefined) {
        if (field.type === 'checkbox') {
          (field as HTMLInputElement).checked = formData[fieldName];
        } else if (field.type === 'radio') {
          (field as HTMLInputElement).checked = field.value === formData[fieldName];
        } else {
          field.value = formData[fieldName];
        }
        // Trigger change event to update React state
        field.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  }, [formData, fields]);

  const clearFormData = useCallback(() => {
    setFormData({});
  }, [setFormData]);

  const handleFormSubmit = useCallback(() => {
    if (clearOnSubmit) {
      clearFormData();
    }
  }, [clearOnSubmit, clearFormData]);

  useEffect(() => {
    // Restore form data on mount
    if (Object.keys(formData).length > 0) {
      // Delay restoration to ensure form is rendered
      setTimeout(restoreFormData, 100);
    }
  }, [restoreFormData, formData]);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    const handleSubmit = () => handleFormSubmit();
    form.addEventListener('submit', handleSubmit);

    return () => {
      form.removeEventListener('submit', handleSubmit);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [handleFormSubmit]);

  return {
    formRef,
    saveFieldValue,
    restoreFormData,
    clearFormData,
    formData
  };
}
