import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Privacy() {
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
          <h1 className="text-4xl font-bold text-white mb-8">Datenschutzerklärung</h1>

          <div className="space-y-8 text-slate-300">
            <section>
              <h2 className="text-2xl font-bold text-cyan-400 mb-4">1. Datenschutz auf einen Blick</h2>
              
              <h3 className="text-xl font-semibold text-white mb-3 mt-6">Allgemeine Hinweise</h3>
              <p className="leading-relaxed mb-4">
                Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen 
                Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit 
                denen Sie persönlich identifiziert werden können.
              </p>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">Datenerfassung auf dieser Website</h3>
              <p className="leading-relaxed mb-4">
                <strong className="text-cyan-400">Wer ist verantwortlich für die Datenerfassung auf dieser Website?</strong><br />
                Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten 
                können Sie dem Impressum dieser Website entnehmen.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-cyan-400 mb-4">2. Hosting</h2>
              <p className="leading-relaxed mb-4">
                Diese Website wird bei Base44 gehostet. Der Hoster speichert automatisch Informationen in 
                sogenannten Server-Log-Dateien, die Ihr Browser automatisch an uns übermittelt. Dies sind:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Browsertyp und Browserversion</li>
                <li>Verwendetes Betriebssystem</li>
                <li>Referrer URL</li>
                <li>Hostname des zugreifenden Rechners</li>
                <li>Uhrzeit der Serveranfrage</li>
                <li>IP-Adresse</li>
              </ul>
              <p className="leading-relaxed">
                Diese Daten werden nicht mit anderen Datenquellen zusammengeführt. Die Erfassung dieser Daten 
                erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO zur Gewährleistung eines störungsfreien 
                Betriebs unserer Website.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-cyan-400 mb-4">3. Allgemeine Hinweise und Pflichtinformationen</h2>
              
              <h3 className="text-xl font-semibold text-white mb-3 mt-6">Datenschutz</h3>
              <p className="leading-relaxed mb-4">
                Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln 
                Ihre personenbezogenen Daten vertraulich und entsprechend der gesetzlichen Datenschutzvorschriften 
                sowie dieser Datenschutzerklärung.
              </p>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">Hinweis zur verantwortlichen Stelle</h3>
              <p className="leading-relaxed mb-4">
                Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:
              </p>
              <p className="leading-relaxed mb-4">
                Vanessa Schumacher<br />
                Marienstr. 40<br />
                50374 Erftstadt<br />
                E-Mail: info@axon-nap.de
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-cyan-400 mb-4">4. Ihre Rechte</h2>
              <p className="leading-relaxed mb-4">
                Sie haben jederzeit das Recht auf unentgeltliche Auskunft über Ihre gespeicherten personenbezogenen 
                Daten, deren Herkunft und Empfänger und den Zweck der Datenverarbeitung sowie ein Recht auf 
                Berichtigung oder Löschung dieser Daten.
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Recht auf Auskunft (Art. 15 DSGVO)</li>
                <li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
                <li>Recht auf Löschung (Art. 17 DSGVO)</li>
                <li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
                <li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</li>
                <li>Widerspruchsrecht (Art. 21 DSGVO)</li>
                <li>Beschwerderecht bei einer Aufsichtsbehörde (Art. 77 DSGVO)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-cyan-400 mb-4">5. Datenverarbeitung in der AXON App</h2>
              
              <h3 className="text-xl font-semibold text-white mb-3 mt-6">Gesundheitsbezogene Daten</h3>
              <p className="leading-relaxed mb-4">
                Im Rahmen der Nutzung von AXON verarbeiten wir folgende gesundheitsbezogene Daten:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong className="text-cyan-400">Daily Readiness Check:</strong> Täglich erfassen wir Ihre subjektive Einschätzung zu Gefühl (Hardware: 1-10), Fokus (Software: 1-10) und Energie (Batterie: 1-10). Diese Daten dienen der individualisierten Trainingssteuerung und werden ausschließlich für die Funktionalität der App verwendet.</li>
                <li><strong className="text-cyan-400">Schmerzpunkte und Beschwerden:</strong> Sie können Schmerzstellen auf einer interaktiven Körperkarte markieren und Intensität angeben. Diese Informationen werden zur Erstellung personalisierter Rehabilitationspläne verwendet.</li>
                <li><strong className="text-cyan-400">Trainingspläne und Fortschritte:</strong> Ihre Trainingshistorie, Performance-Ziele und Fortschritte werden gespeichert, um Ihnen adaptive Trainingsprogramme bereitzustellen.</li>
                <li><strong className="text-cyan-400">Bewegungs- und Assessments:</strong> Ergebnisse von Bewegungstests und neurologischen Drills werden zur Analyse Ihres aktuellen Status gespeichert.</li>
              </ul>
              <p className="leading-relaxed mb-4">
                <strong className="text-white">Rechtsgrundlage:</strong> Die Verarbeitung erfolgt auf Grundlage Ihrer Einwilligung (Art. 6 Abs. 1 lit. a, Art. 9 Abs. 2 lit. a DSGVO), da Sie diese Daten freiwillig zur Nutzung der App-Funktionen bereitstellen.
              </p>
              <p className="leading-relaxed">
                <strong className="text-white">Datenspeicherung:</strong> Ihre Daten werden solange gespeichert, wie Sie die App nutzen. Sie können Ihr Konto und alle damit verbundenen Daten jederzeit über die Profil-Einstellungen löschen oder uns per E-Mail kontaktieren.
              </p>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">Keine Weitergabe an Dritte</h3>
              <p className="leading-relaxed">
                Ihre gesundheitsbezogenen Daten werden <strong className="text-cyan-400">nicht an Dritte weitergegeben, verkauft oder für Werbezwecke verwendet</strong>. Die Datenverarbeitung erfolgt ausschließlich zur Bereitstellung der App-Funktionalität.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-cyan-400 mb-4">6. Cookies</h2>
              <p className="leading-relaxed mb-4">
                Unsere Website verwendet Cookies. Cookies sind kleine Textdateien, die auf Ihrem Endgerät 
                gespeichert werden und die Ihr Browser speichert. Sie dienen dazu, unser Angebot nutzerfreundlicher, 
                effektiver und sicherer zu machen.
              </p>
              <p className="leading-relaxed">
                Die meisten der von uns verwendeten Cookies sind sogenannte „Session-Cookies". Sie werden nach Ende 
                Ihres Besuchs automatisch gelöscht. Sie können Ihren Browser so einstellen, dass Sie über das Setzen 
                von Cookies informiert werden und Cookies nur im Einzelfall erlauben.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-cyan-400 mb-4">7. Zahlungsdienstleister</h2>
              <p className="leading-relaxed">
                Wir nutzen Stripe für die Zahlungsabwicklung. Anbieter ist die Stripe Inc., 510 Townsend Street, 
                San Francisco, CA 94103, USA. Bei der Nutzung von Stripe werden Daten an Stripe übermittelt. 
                Details entnehmen Sie der Datenschutzerklärung von Stripe: 
                <a href="https://stripe.com/de/privacy" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline ml-1">
                  https://stripe.com/de/privacy
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}