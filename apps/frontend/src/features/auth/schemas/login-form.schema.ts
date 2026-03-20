import * as Yup from 'yup';

export const loginFormSchema = Yup.object({
  email: Yup.string()
    .email('Ingresa un email valido.')
    .required('El email es obligatorio.'),
  password: Yup.string().required('La contrasena es obligatoria.'),
});
