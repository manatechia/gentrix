import * as Yup from 'yup';

export const loginFormSchema = Yup.object({
  email: Yup.string()
    .email('Ingrese un email válido.')
    .required('El email es obligatorio.'),
  password: Yup.string().required('La contraseña es obligatoria.'),
});
