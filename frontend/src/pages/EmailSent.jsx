import { useLocation, Link } from "react-router-dom";

export default function EmailSent() {
  const location = useLocation();
  const email = location.state?.email;

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="w-full sm:w-[500px] bg-white p-8 text-center">
        <img
          src="/images/logo2.png"
          alt="MoodMeet Logo"
          className="mx-auto mb-6 w-24 h-24 object-contain"
        />

        <h1 className="text-2xl font-semibold text-teal-700 mb-4">
          Verification Email Sent
        </h1>

        <p className="text-gray-700 mb-6">
          A verification email has been sent
          {email ? (
            <>
              {" "}
              to <span className="font-medium">{email}</span>.
            </>
          ) : (
            "."
          )}{" "}
          Please check your inbox (or spam folder) and click the link to verify
          your account.
        </p>

        <p className="text-gray-600 mb-6">
          After verifying, you can log in using your registered email and password.
        </p>

        <Link
          to="/"
          className="inline-block bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition duration-300"
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
}
