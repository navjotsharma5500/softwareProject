import React from 'react';
import { useDarkMode } from '../context/DarkModeContext';

const HowItWorks = () => {
  const { darkMode, toggleDarkMode } = useDarkMode();

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} py-12 px-4 sm:px-6 lg:px-8`}>
      <div className={`max-w-4xl mx-auto ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-8`}>
        <h1 className={`text-4xl md:text-5xl font-bold mb-10 ${darkMode ? 'text-indigo-400' : 'text-indigo-700'} text-center`}>
          How the Lost & Found Portal Works
        </h1>

        <section className="mb-8">
          <h2 className={`text-2xl font-bold mb-3 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            Why We Built This <span aria-hidden>🔎</span>
          </h2>
          <div className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} leading-relaxed space-y-3`}>
            <p>
              Historically, campus-wide <span className="font-semibold">lost-and-found updates</span> were sent as <span className="font-semibold">mass emails</span> to everyone. People who haven't lost anything often ignore these messages. That <span className="font-semibold">clutters inboxes</span> and can cause important communications (for example, internship or administrative notices) to get buried and missed.
            </p>
            <p>
              This portal fixes that by centralizing found-item listings and claims where people expect to look. Administrators list only items they physically hold, and only users who need to check (or who have reported a loss) need to visit the portal. The result is <span className="font-semibold">less inbox noise</span>, fewer missed emails, and clearer, more reliable matching and claiming.
            </p>
            <p>
              We also added a dedicated <span className="font-semibold">Report Lost Item 📝</span> feature so people can submit structured reports with photos and location details. Reports with clear images and accurate locations are far more credible than anonymous claims — admins are therefore more likely to trust and prioritise a claimant who has submitted a proper report. The portal links reports to claims and provides the admin dashboard with counts and statuses (submitted, accepted, rejected). This helps detect repeated or suspicious claim patterns and reduces manual work compared to scanning many emails.
            </p>
            <p>
              <strong>⚠️ Important safety note:</strong> Avoid sharing detailed photos or precise locations of lost items in mass emails. Posting images or locations widely can make items easier for dishonest actors to find and steal. Use this portal so sensitive information stays within controlled, verifiable channels.
            </p>
          </div>
        </section>

        <section className="mb-10">
          <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-900'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} pb-2`}>
            Overview <span aria-hidden>📋</span>
          </h2>
          <div className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} leading-relaxed space-y-3`}>
            <p>
              This portal is managed by Thapar University administration. <span className={`font-semibold ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>📌 Only items that have been physically deposited with the campus guard or admin are listed here as found items.</span> If you have lost something, you can file a report here. If you find an item, <span className="font-semibold">please hand it over to the campus guard or admin</span>. The admin will add it to the portal if it is in their possession.
            </p>
            <div className={`${darkMode ? 'bg-gray-700/50' : 'bg-indigo-50'} p-4 rounded-lg border-l-4 ${darkMode ? 'border-indigo-400' : 'border-indigo-600'}`}>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>
                <span className={`font-bold ${darkMode ? 'text-indigo-400' : 'text-indigo-700'}`}>🔔 Important:</span> It is <span className="font-semibold">not</span> the admin's responsibility to proactively search for your lost item or to match found items with your report. There is currently no automated or AI/ML system for matching lost and found items. The admin's role is to securely store deposited items, upload them to the portal, and verify claims in person at the office. <span className="font-semibold">It is your responsibility to check the portal and apply for claim if you have lost something.</span>
              </p>
            </div>
           
          </div>
        </section>

        <section className="mb-10">
          <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-900'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} pb-2`}>
            If You Lost an Item <span aria-hidden>🧭</span>
          </h2>
          <ol className={`list-decimal list-inside ${darkMode ? 'text-gray-300' : 'text-gray-700'} space-y-3 pl-2`}>
            <li className="pl-2">
              <span className="mr-2">📝</span>
              Click the{' '}
              <a
                href="/report-lost-item"
                className={`font-semibold underline ${darkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-500'}`}
              >
                Report Lost Item
              </a>{' '}
              button in the navigation bar.
            </li>
            <li className="pl-2">
              <span className="mr-2">📸</span>
              Fill out the form with details and (optionally) upload photos.
            </li>
            <li className="pl-2">
              <span className="mr-2">🔐</span>
              If not logged in, you'll be asked to log in before submitting.
            </li>
            <li className="pl-2">
              <span className="mr-2">👀</span>
              Your report will be visible to you and administrators only.
            </li>
            <li className="pl-2">
              <span className="mr-2">✅</span>
              If your item is found and deposited with the admin, it will appear in the portal's found items list and you can submit a claim.
            </li>
          </ol>
        </section>

        <section className="mb-10">
          <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-900'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} pb-2`}>
            If You Found an Item <span aria-hidden>📦</span>
          </h2>
          <ol className={`list-decimal list-inside ${darkMode ? 'text-gray-300' : 'text-gray-700'} space-y-3 pl-2`}>
            <li className="pl-2">
              <span className="mr-2">⚠️</span>
              <span className="font-bold">You cannot list found items yourself.</span> Only the admin can add found items to the portal.
            </li>
            <li className="pl-2">
              <span className="mr-2">🤝</span>
              If you find an item, immediately hand it over to the campus guard or admin.
            </li>
            <li className="pl-2">
              <span className="mr-2">➕</span>
              Once the admin has the item, they will add it to the portal for others to see and claim.
            </li>
            <li className="pl-2">
              <span className="mr-2">🔒</span>
              This process ensures all listed found items are actually in the admin's possession, making the portal credible and secure.
            </li>
          </ol>
        </section>

        <section className="mb-10">
          <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-900'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} pb-2`}>
            Why Some Images/Reports Are Not Public <span aria-hidden>🔒</span>
          </h2>
          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
            For privacy and security, images and details of lost item reports are only visible to the report creator and admins. Found items may be shown publicly, but sensitive information is protected.
          </p>
        </section>

        <section className="mb-10">
          <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-900'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} pb-2`}>
            FAQs <span aria-hidden>❓</span>
          </h2>
          <div className="space-y-4">
            <div className={`${darkMode ? 'bg-gray-700/30' : 'bg-gray-50'} p-4 rounded-lg`}>
              <p className={`font-semibold ${darkMode ? 'text-indigo-400' : 'text-indigo-700'} mb-2`}>
                Do I need to log in? <span aria-hidden>🔑</span>
              </p>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Yes, to submit or claim items, you must log in for security and tracking.
              </p>
            </div>
            <div className={`${darkMode ? 'bg-gray-700/30' : 'bg-gray-50'} p-4 rounded-lg`}>
              <p className={`font-semibold ${darkMode ? 'text-indigo-400' : 'text-indigo-700'} mb-2`}>
                Why can't I see some images? <span aria-hidden>👁️</span>
              </p>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Only admins and the report creator can view lost item images for privacy reasons.
              </p>
            </div>
            <div className={`${darkMode ? 'bg-gray-700/30' : 'bg-gray-50'} p-4 rounded-lg`}>
              <p className={`font-semibold ${darkMode ? 'text-indigo-400' : 'text-indigo-700'} mb-2`}>
                How do I know if my claim/report is approved? <span aria-hidden>✅</span>
              </p>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                To claim an item, you must first submit a claim for it on the portal. After submitting your claim, visit the admin office in person during working hours (Mon–Fri, 09:00–17:00 on Thapar working days). The admin will ask you questions (a "viva") about the item to verify your ownership and will check if you have filed a missing report. Only after successful verification will the item be handed over to you — check your profile page for status updates.
              </p>
            </div>
          </div>
        </section>

        <section className={`${darkMode ? 'bg-indigo-900/30' : 'bg-indigo-50'} p-6 rounded-lg border ${darkMode ? 'border-indigo-700' : 'border-indigo-200'}`}>
          <h2 className={`text-2xl font-bold mb-3 ${darkMode ? 'text-indigo-400' : 'text-indigo-700'}`}>
            Need Help? <span aria-hidden>🆘</span>
          </h2>
          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            For assistance, please visit the admin office in person during working hours (Mon–Fri, 09:00–17:00 on Thapar working days). The admin team prefers in-person queries to ensure privacy and accurate verification.
          </p>
        </section>
      </div>
    </div>
  );
};

export default HowItWorks;