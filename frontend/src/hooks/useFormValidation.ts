import { useState, useCallback, useMemo } from 'react';
import { z } from 'zod';

interface UseFormValidationProps<T> {
  schema: z.ZodSchema<T>;
  initialValues?: Partial<T>;
  mode?: 'onChange' | 'onSubmit' | 'onBlur';
}

interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

interface UseFormValidationReturn<T> {
  values: T;
  errors: Record<string, string>;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  setValue: (field: keyof T, value: any) => void;
  setValues: (values: Partial<T>) => void;
  setFieldError: (field: keyof T, error: string) => void;
  clearFieldError: (field: keyof T) => void;
  clearErrors: () => void;
  validateField: (field: keyof T) => Promise<boolean>;
  validateForm: () => Promise<ValidationResult>;
  handleSubmit: (onSubmit: (values: T) => void | Promise<void>) => Promise<void>;
  reset: (newValues?: Partial<T>) => void;
}

function useFormValidation<T extends Record<string, any>>({
  schema,
  initialValues = {},
  mode = 'onChange',
}: UseFormValidationProps<T>): UseFormValidationReturn<T> {
  const [values, setValuesState] = useState<T>(() => {
    // Get default values from schema if available
    const defaultValues = {} as T;
    try {
      const parsed = schema.parse({});
      Object.assign(defaultValues, parsed);
    } catch {
      // Schema doesn't have default values or parsing failed
    }
    return { ...defaultValues, ...initialValues } as T;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Track initial values for dirty checking
  const [initialValuesState] = useState(values);

  // Check if form is dirty
  const checkIsDirty = useCallback((newValues: T) => {
    return JSON.stringify(newValues) !== JSON.stringify(initialValuesState);
  }, [initialValuesState]);

  // Validate a single field
  const validateField = useCallback(async (field: keyof T): Promise<boolean> => {
    try {
      // Create a partial schema for the specific field
      const fieldSchema = schema.pick({ [field]: true } as any);
      await fieldSchema.parseAsync({ [field]: values[field] });
      
      // Clear error if validation passed
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
      
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldError = error.errors.find(err => err.path.includes(field as string));
        if (fieldError) {
          setErrors(prev => ({
            ...prev,
            [field]: fieldError.message,
          }));
        }
      }
      return false;
    }
  }, [schema, values]);

  // Validate entire form
  const validateForm = useCallback(async (): Promise<ValidationResult> => {
    try {
      await schema.parseAsync(values);
      setErrors({});
      return { isValid: true, errors: {} };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formErrors: Record<string, string> = {};
        
        error.errors.forEach(err => {
          const fieldName = err.path.join('.');
          if (!formErrors[fieldName]) {
            formErrors[fieldName] = err.message;
          }
        });
        
        setErrors(formErrors);
        return { isValid: false, errors: formErrors };
      }
      return { isValid: false, errors: {} };
    }
  }, [schema, values]);

  // Set single field value
  const setValue = useCallback((field: keyof T, value: any) => {
    const newValues = { ...values, [field]: value };
    setValuesState(newValues);
    setIsDirty(checkIsDirty(newValues));

    // Validate field on change if mode is onChange
    if (mode === 'onChange') {
      validateField(field);
    }
  }, [values, mode, validateField, checkIsDirty]);

  // Set multiple values
  const setValues = useCallback((newValues: Partial<T>) => {
    const updatedValues = { ...values, ...newValues };
    setValuesState(updatedValues);
    setIsDirty(checkIsDirty(updatedValues));

    // Validate changed fields if mode is onChange
    if (mode === 'onChange') {
      Object.keys(newValues).forEach(field => {
        validateField(field as keyof T);
      });
    }
  }, [values, mode, validateField, checkIsDirty]);

  // Set field error manually
  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors(prev => ({
      ...prev,
      [field]: error,
    }));
  }, []);

  // Clear field error
  const clearFieldError = useCallback((field: keyof T) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field as string];
      return newErrors;
    });
  }, []);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(async (onSubmit: (values: T) => void | Promise<void>) => {
    setIsSubmitting(true);
    
    try {
      const validation = await validateForm();
      
      if (validation.isValid) {
        await onSubmit(values);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm, values]);

  // Reset form
  const reset = useCallback((newValues?: Partial<T>) => {
    const resetValues = newValues ? { ...values, ...newValues } : initialValuesState;
    setValuesState(resetValues);
    setErrors({});
    setIsDirty(false);
    setIsSubmitting(false);
  }, [values, initialValuesState]);

  // Compute if form is valid
  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  return {
    values,
    errors,
    isValid,
    isDirty,
    isSubmitting,
    setValue,
    setValues,
    setFieldError,
    clearFieldError,
    clearErrors,
    validateField,
    validateForm,
    handleSubmit,
    reset,
  };
}

export default useFormValidation;
