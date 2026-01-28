import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Terms() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link to={createPageUrl('Landing')}>
          <Button variant="ghost" className="mb-8 text-slate-400 hover:text-cyan-400">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
        </Link>

        <div className="glass rounded-2xl border border-cyan-500/20 p-8 md:p-12">
          <h1 className="text-4xl font-bold text-white mb-8">Allgemeine Geschäftsbedingungen (AGB)</h1>

          <div className="space-y-8 text-slate-300">
            <section>
              <h2 className="text-2xl font-bold text-cyan-400 mb-4">1. Geltungsbereich</h2>
              <p className="leading-relaxed">
                Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Verträge zwischen Vanessa Schumacher 
                und den Nutzern der AXON Web-App. Mit der Nutzung von AXON erklärt sich der Nutzer mit diesen 
                AGB einverstanden.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-cyan-400 mb-4">2. Vertragsgegenstand</h2>
              <p className="leading-relaxed mb-4">
                AXON ist eine digitale Web-Anwendung (Progressive Web App) zur funktionellen Bewegungsanalyse 
                und neuro-athletischen Optimierung. Der Nutzer erhält durch eine einmalige Zahlung einen 
                lebenslangen Zugang zur AXON-Plattform.
              </p>
              <p className="leading-relaxed">
                <strong className="text-cyan-400">Wichtiger Hinweis:</strong> AXON ist kein medizinisches Produkt 
                und ersetzt keine ärztliche Diagnose oder Behandlung. Die Nutzung erfolgt auf eigene Verantwortung.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-cyan-400 mb-4">3. Vertragsschluss</h2>
              <p className="leading-relaxed mb-4">
                Der Vertrag kommt durch die erfolgreiche Zahlung des Kaufpreises über den Zahlungsdienstleister 
                Stripe zustande. Nach Zahlungseingang erhält der Nutzer sofortigen Zugang zur AXON-Plattform.
              </p>
              <p className="leading-relaxed">
                Mit dem Kauf bestätigt der Nutzer, dass er mindestens 18 Jahre alt ist und die AGB sowie die 
                Datenschutzerklärung gelesen und akzeptiert hat.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-cyan-400 mb-4">4. Preise und Zahlung</h2>
              <p className="leading-relaxed mb-4">
                Der Kaufpreis für den Lifetime-Zugang zu AXON beträgt einmalig 59,- € (Endpreis, keine MwSt. gemäß § 19 UStG). 
                Es fallen keine weiteren Abonnement- oder Folgekosten an.
              </p>
              <p className="leading-relaxed">
                Die Zahlung erfolgt ausschließlich über den Zahlungsdienstleister Stripe. Es gelten die 
                Zahlungsbedingungen von Stripe.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-cyan-400 mb-4">5. Widerrufsrecht</h2>
              <p className="leading-relaxed mb-4">
                Verbrauchern steht grundsätzlich gemäß § 312g BGB ein gesetzliches Widerrufsrecht zu:
              </p>
              <div className="bg-slate-800/50 rounded-xl p-6 border border-cyan-500/20 mb-6">
                <p className="leading-relaxed mb-4">
                  <strong className="text-white">Widerrufsbelehrung</strong>
                </p>
                <p className="leading-relaxed mb-4">
                  Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. 
                  Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsabschlusses.
                </p>
                <p className="leading-relaxed">
                  Um Ihr Widerrufsrecht auszuüben, müssen Sie uns (Vanessa Schumacher, Marienstr. 40, 50374 Erftstadt, 
                  E-Mail: info@axon-protocol.com) mittels einer eindeutigen Erklärung über Ihren Entschluss, 
                  diesen Vertrag zu widerrufen, informieren.
                </p>
              </div>

              <div className="bg-red-900/20 rounded-xl p-6 border border-red-500/30">
                <p className="leading-relaxed mb-4">
                  <strong className="text-red-400">Vorzeitiges Erlöschen des Widerrufsrechts bei digitalen Inhalten</strong>
                </p>
                <p className="leading-relaxed mb-4">
                  Gemäß § 356 Abs. 5 BGB erlischt Ihr Widerrufsrecht vorzeitig, wenn Sie ausdrücklich zugestimmt haben, 
                  dass wir mit der Ausführung des Vertrags vor Ablauf der Widerrufsfrist beginnen, und Sie zur Kenntnis 
                  genommen haben, dass Sie durch Ihre Zustimmung mit Beginn der Ausführung des Vertrags Ihr Widerrufsrecht 
                  verlieren.
                </p>
                <p className="leading-relaxed mb-4">
                  <strong className="text-white">Da AXON ein digitaler Inhalt ist, der sofort nach Zahlungseingang bereitgestellt wird</strong>, 
                  stimmen Sie beim Kauf ausdrücklich zu, dass:
                </p>
                <ul className="list-disc list-inside space-y-2 text-slate-300">
                  <li>Die Leistung sofort nach dem Kauf erbracht wird (Zugang zur Web-App)</li>
                  <li>Sie auf Ihr Widerrufsrecht verzichten, sobald Sie Zugriff auf AXON erhalten</li>
                  <li>Eine Rückgabe nach erfolgter Nutzung aus technischen und rechtlichen Gründen ausgeschlossen ist</li>
                </ul>
              </div>

              <div className="bg-slate-800/50 rounded-xl p-6 border border-cyan-500/20 mt-6">
                <p className="text-sm leading-relaxed text-slate-400">
                  <strong className="text-cyan-400">Fairness-Garantie:</strong> Sollte AXON aus technischen Gründen 
                  (z.B. Browser-Inkompatibilität) bei Ihnen nicht funktionieren, kontaktieren Sie uns innerhalb von 
                  48 Stunden nach dem Kauf. Wir finden gemeinsam eine Lösung.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-cyan-400 mb-4">6. Nutzungsrechte und Einschränkungen</h2>
              <p className="leading-relaxed mb-4">
                Der Nutzer erhält ein nicht übertragbares, nicht ausschließliches Recht zur persönlichen Nutzung 
                von AXON. Folgende Handlungen sind untersagt:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Weitergabe der Zugangsdaten an Dritte</li>
                <li>Kommerzielle Nutzung ohne schriftliche Genehmigung</li>
                <li>Reverse Engineering, Dekompilierung oder Disassemblierung der Software</li>
                <li>Entfernung von Urheberrechtsvermerken</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-cyan-400 mb-4">7. Haftungsausschluss</h2>
              <p className="leading-relaxed mb-4">
                <strong className="text-cyan-400">Wichtiger Haftungsausschluss:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>AXON ist ein Wellness- und Performance-Tool, kein medizinisches Gerät</li>
                <li>Die Nutzung ersetzt keine ärztliche Untersuchung oder Behandlung</li>
                <li>Bei bestehenden Verletzungen oder Beschwerden konsultieren Sie einen Arzt</li>
                <li>Die Ausführung der Übungen erfolgt auf eigene Verantwortung</li>
                <li>Wir haften nicht für Verletzungen oder Schäden, die durch unsachgemäße Nutzung entstehen</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-cyan-400 mb-4">8. Gewährleistung und Updates</h2>
              <p className="leading-relaxed mb-4">
                Wir bemühen uns, AXON stets funktionsfähig und aktuell zu halten. Es besteht jedoch kein 
                Rechtsanspruch auf:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Ständige Verfügbarkeit (24/7)</li>
                <li>Fehlerfreiheit der Anwendung</li>
                <li>Regelmäßige Updates oder neue Features</li>
              </ul>
              <p className="leading-relaxed mt-4">
                Lifetime-Zugang bedeutet: Solange AXON betrieben wird, haben Sie Zugriff. Es besteht kein 
                Anspruch auf unbegrenzte Verfügbarkeit bis in alle Ewigkeit.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-cyan-400 mb-4">9. Datenschutz</h2>
              <p className="leading-relaxed">
                Für die Verarbeitung personenbezogener Daten gilt unsere Datenschutzerklärung, die Sie unter 
                dem entsprechenden Link einsehen können.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-cyan-400 mb-4">10. Schlussbestimmungen</h2>
              <p className="leading-relaxed mb-4">
                Es gilt das Recht der Bundesrepublik Deutschland. Sollten einzelne Bestimmungen dieser AGB 
                unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.
              </p>
              <p className="leading-relaxed text-sm">
                Stand: Januar 2026
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}