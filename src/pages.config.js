import Dashboard from './pages/Dashboard';
import DiagnosisWizard from './pages/DiagnosisWizard';
import ExerciseImageGenerator from './pages/ExerciseImageGenerator';
import Performance from './pages/Performance';
import DiagnosisChat from './pages/DiagnosisChat';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "DiagnosisWizard": DiagnosisWizard,
    "ExerciseImageGenerator": ExerciseImageGenerator,
    "Performance": Performance,
    "DiagnosisChat": DiagnosisChat,
}

export const pagesConfig = {
    mainPage: "DiagnosisWizard",
    Pages: PAGES,
    Layout: __Layout,
};