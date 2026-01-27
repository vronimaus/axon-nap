import Dashboard from './pages/Dashboard';
import DiagnosisWizard from './pages/DiagnosisWizard';
import DiagnosisChat from './pages/DiagnosisChat';
import ExerciseImageGenerator from './pages/ExerciseImageGenerator';
import Performance from './pages/Performance';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "DiagnosisWizard": DiagnosisWizard,
    "DiagnosisChat": DiagnosisChat,
    "ExerciseImageGenerator": ExerciseImageGenerator,
    "Performance": Performance,
}

export const pagesConfig = {
    mainPage: "DiagnosisWizard",
    Pages: PAGES,
    Layout: __Layout,
};