/* eslint-disable react/no-danger */
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { useIntl } from 'react-intl';

import useCreateUser from '../modules/auth/hooks/useCreateUser';
import useUpdateCart from '../modules/checkout/hooks/useUpdateCart';
import Header from '../modules/layout/components/Header';
import LoginForm from '../modules/auth/components/LoginForm';
import Footer from '../modules/layout/components/Footer';
import MetaTags from '../modules/common/components/MetaTags';

const ErrorDisplay = ({ error }) => {
  const intl = useIntl();
  if (!error) return '';

  if (error.message.includes('Email already exists.')) {
    return (
      <div className="form-error my-3">
        👬 {intl.formatMessage({ id: 'email_exists' })}.
      </div>
    );
  }

  return <div className="form-error my-3">👷‍♀️ An unknown error occurred.</div>;
};

const SignUp = () => {
  const router = useRouter();
  const { register, handleSubmit, watch, errors, setError } = useForm();
  const intl = useIntl();
  const { updateCart } = useUpdateCart();
  const { createUser, error } = useCreateUser();
  const hasErrors = Object.keys(errors).length;

  useEffect(() => {
    if (error?.message?.includes('Email already exists.')) {
      setError(
        'emailAddress',
        'alreadyExists',
        '👬 Es existiert bereits ein Benutzer mit dieser E-Mail Adresse.',
      );
    }
  }, [error]);

  const createAccount = watch('account');

  const onSubmit = async ({
    firstName,
    lastName,
    company,
    addressLine,
    postalCode,
    city,
    emailAddress,
    telNumber,
    account,
    password,
    password2,
  }) => {
    if (account) {
      if (password !== password2) {
        setError('password', 'notMatch', 'Passwörter sind nicht gleich');
        setError('password2', 'notMatch', 'Passwörter sind nicht gleich');
        return false;
      }
      await createUser({
        email: emailAddress,
        password,
        profile: {
          displayName: lastName,
          phoneMobile: telNumber,
          address: {
            firstName,
            lastName,
            company,
            addressLine,
            postalCode,
            city,
          },
        },
      });
    }

    await updateCart({
      contact: { emailAddress, telNumber },
      billingAddress: {
        firstName,
        lastName,
        company,
        addressLine,
        postalCode,
        city,
      },
    });

    router.push('/review');
    return true;
  };

  const onLogin = () => router.push('/review');

  return (
    <>
      <MetaTags
        title={`${intl.formatMessage({
          id: 'log_in',
        })} or ${intl.formatMessage({ id: 'register' })}`}
      />
      <Header />
      <div className="container">
        <div className="row">
          <div className="col-lg-6">
            <h2>{intl.formatMessage({ id: 'log_in' })}</h2>
            <p>{intl.formatMessage({ id: 'already_have_account' })} </p>
            <LoginForm onLogin={onLogin} />
          </div>
          <div className="col-lg-6">
            <h2> {intl.formatMessage({ id: 'order_without_account' })} </h2>
            <form className="form" onSubmit={handleSubmit(onSubmit)}>
              <div className="form-check mb-3">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="account"
                  name="account"
                  ref={register}
                />
                <label className="form-check-label mb-0" htmlFor="account">
                  {intl.formatMessage({ id: 'create_an_account' })}
                </label>
              </div>
              <div className="form-row">
                <div
                  className={`mb-3 col-md-6 ${
                    errors.firstName ? 'form-error' : ''
                  }`}
                >
                  <label className="form-label">
                    {intl.formatMessage({ id: 'first_name' })}
                  </label>
                  <input
                    className="form-control"
                    name="firstName"
                    ref={register({ required: true })}
                  />
                </div>
                <div
                  className={`mb-3 col-md-6 ${
                    errors.lastName ? 'form-error' : ''
                  }`}
                >
                  <label className="form-label">
                    {intl.formatMessage({ id: 'last_name' })}
                  </label>
                  <input
                    className={`form-control ${
                      errors.lastName && 'form-error'
                    }`}
                    name="lastName"
                    ref={register({ required: true })}
                  />
                </div>
                <div
                  className={`mb-3 col-md-6 ${
                    errors.company ? 'form-error' : ''
                  }`}
                >
                  <label className="form-label">
                    {intl.formatMessage({ id: 'company' })}{' '}
                    {intl.formatMessage({ id: 'optional' })}
                  </label>
                  <input
                    className="form-control"
                    name="company"
                    ref={register}
                  />
                </div>
                <div
                  className={`mb-3 col-md-6 ${
                    errors.addressLine ? 'form-error' : ''
                  }`}
                >
                  <label className="form-label">
                    {intl.formatMessage({ id: 'address' })}
                  </label>
                  <input
                    className={`form-control ${
                      errors.addressLine && 'form-error'
                    }`}
                    name="addressLine"
                    ref={register({ required: true })}
                  />
                </div>
                <div
                  className={`mb-3 col-md-6 ${
                    errors.postalCode ? 'form-error' : ''
                  }`}
                >
                  <label className="form-label">
                    {intl.formatMessage({ id: 'postal_code' })}
                  </label>
                  <input
                    className={`form-control ${
                      errors.postalCode && 'form-error'
                    }`}
                    name="postalCode"
                    ref={register({ required: true })}
                  />
                </div>
                <div
                  className={`mb-3 col-md-6 ${errors.city ? 'form-error' : ''}`}
                >
                  <label className="form-label">
                    {intl.formatMessage({ id: 'city' })}
                  </label>
                  <input
                    className={`form-control ${errors.city && 'form-error'}`}
                    name="city"
                    ref={register({ required: true })}
                  />
                </div>
                <div
                  className={`mb-3 col-md-6 ${
                    errors.emailAddress ? 'form-error' : ''
                  }`}
                >
                  <label className="form-label">
                    {intl.formatMessage({ id: 'city' })}
                  </label>
                  <input
                    className={`form-control ${
                      errors.emailAddress && 'form-error'
                    }`}
                    name="emailAddress"
                    ref={register({ required: true })}
                  />
                </div>
                <div
                  className={`mb-3 col-md-6 ${
                    errors.telNumber ? 'form-error' : ''
                  }`}
                >
                  <label className="form-label">
                    {intl.formatMessage({ id: 'telephone' })}
                  </label>
                  <input
                    className={`form-control ${
                      errors.telNumber && 'form-error'
                    }`}
                    name="telNumber"
                    ref={register({ required: true })}
                  />
                </div>
                {createAccount ? (
                  <>
                    <div
                      className={`mb-3 col-md-6 ${
                        errors.password ? 'form-error' : ''
                      }`}
                    >
                      <label className="form-label">
                        {intl.formatMessage({ id: 'password' })}
                      </label>
                      <input
                        className="form-control"
                        name="password"
                        type="password"
                        ref={register({ required: true })}
                      />
                    </div>
                    <div
                      className={`mb-3 col-md-6 ${
                        errors.password2 ? 'form-error' : ''
                      }`}
                    >
                      <label className="form-label">
                        {intl.formatMessage({ id: 'repeat_password' })}
                      </label>
                      <input
                        className="form-control"
                        name="password2"
                        type="password"
                        ref={register({ required: true })}
                      />
                    </div>
                  </>
                ) : (
                  ''
                )}
              </div>
              <div
                className={`form-check mb-3 ${errors.agb ? 'form-error' : ''}`}
              >
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="agb"
                  name="agb"
                  ref={register({ required: true })}
                />
                <label
                  className={`form-check-label mb-0 ${
                    errors.agb && 'form-error'
                  }`}
                  htmlFor="conditions"
                  dangerouslySetInnerHTML={{
                    __html: intl.formatMessage({
                      id: 'i_have_read_term',
                    }),
                  }}
                />
              </div>

              <ErrorDisplay error={error} />

              <button
                className="button button--primary button--big"
                type="submit"
                disabled={hasErrors}
              >
                {intl.formatMessage({ id: 'register' })}
              </button>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default SignUp;
