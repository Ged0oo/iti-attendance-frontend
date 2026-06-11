const GradeEntryView = () => import('../views/grading/GradeEntryView.vue');
const GradeOverrideView = () => import('../views/grading/GradeOverrideView.vue');
const StudentGradeCardView = () => import('../views/grading/StudentGradeCardView.vue');
const TagsNotesView = () => import('../views/grading/TagsNotesView.vue');
const InstructorDashboard = () => import('../views/dashboard/InstructorDashboard.vue');
const StudentDashboard = () => import('../views/dashboard/StudentDashboard.vue');

export default [
    {
        path: '/grading/entry',
        name: 'grading.entry',
        component: GradeEntryView,
    },
    {
        path: '/grading/overrides',
        name: 'grading.overrides',
        component: GradeOverrideView,
    },
    {
        path: '/grading/students/:studentId?',
        name: 'grading.student-card',
        component: StudentGradeCardView,
        props: true,
    },
    {
        path: '/grading/tags-notes',
        name: 'grading.tags-notes',
        component: TagsNotesView,
    },
    {
        path: '/dashboards/instructor',
        name: 'dashboard.instructor',
        component: InstructorDashboard,
    },
    {
        path: '/dashboards/student',
        name: 'dashboard.student',
        component: StudentDashboard,
    },
];
