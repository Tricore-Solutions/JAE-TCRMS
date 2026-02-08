// Static employee and training data
const staticData = {
    employees: [
        {
            id: 'EMP-2024-001',
            fullName: 'Maria Santos',
            employmentStatus: 'Active',
            dateHired: '2024-03-15',
            factory: '1ST',
            line: 'MX68',
            team: 'Team A'
        },
        {
            id: 'EMP-2024-002',
            fullName: 'John Reyes',
            employmentStatus: 'Active',
            dateHired: '2024-04-20',
            factory: '1ST',
            line: 'MX68',
            team: 'Team B'
        },
        {
            id: 'EMP-2024-003',
            fullName: 'Ana Cruz',
            employmentStatus: 'Active',
            dateHired: '2024-05-10',
            factory: '2ND',
            line: 'MX48',
            team: 'Team A'
        },
        {
            id: 'EMP-2023-045',
            fullName: 'Pedro Garcia',
            employmentStatus: 'Active',
            dateHired: '2023-09-05',
            factory: '1ST',
            line: 'MX79AC',
            team: 'Team B'
        },
        {
            id: 'EMP-2024-015',
            fullName: 'Carlos Mendoza',
            employmentStatus: 'Active',
            dateHired: '2024-07-10',
            factory: '1ST',
            line: 'MX68',
            team: 'Team A'
        },
        {
            id: 'EMP-2023-089',
            fullName: 'Lisa Fernandez',
            employmentStatus: 'Active',
            dateHired: '2023-05-20',
            factory: '2ND',
            line: 'MX48',
            team: 'Team B'
        },
        {
            id: 'EMP-2024-022',
            fullName: 'Roberto Lim',
            employmentStatus: 'Active',
            dateHired: '2024-06-01',
            factory: '1ST',
            line: 'MX68',
            team: 'Team A'
        },
        {
            id: 'EMP-2024-033',
            fullName: 'Elena Torres',
            employmentStatus: 'Active',
            dateHired: '2024-08-12',
            factory: '2ND',
            line: 'MX48',
            team: 'Team B'
        },
        {
            id: 'EMP-2023-102',
            fullName: 'Miguel Ramos',
            employmentStatus: 'Active',
            dateHired: '2023-11-18',
            factory: '1ST',
            line: 'MX79AC',
            team: 'Team A'
        },
        {
            id: 'EMP-2024-041',
            fullName: 'Sofia Reyes',
            employmentStatus: 'Active',
            dateHired: '2024-09-22',
            factory: '2ND',
            line: 'MX48',
            team: 'Team A'
        },
        {
            id: 'EMP-2024-055',
            fullName: 'James Ong',
            employmentStatus: 'Active',
            dateHired: '2024-10-05',
            factory: '1ST',
            line: 'MX68',
            team: 'Team B'
        },
        {
            id: 'EMP-2023-078',
            fullName: 'Carmen Villanueva',
            employmentStatus: 'Active',
            dateHired: '2023-07-30',
            factory: '2ND',
            line: 'MX48',
            team: 'Team B'
        },
        {
            id: 'EMP-2024-067',
            fullName: 'Daniel Tan',
            employmentStatus: 'Active',
            dateHired: '2024-11-14',
            factory: '1ST',
            line: 'MX79AC',
            team: 'Team A'
        },
        {
            id: 'EMP-2024-071',
            fullName: 'Patricia Gomez',
            employmentStatus: 'Active',
            dateHired: '2024-12-02',
            factory: '1ST',
            line: 'MX68',
            team: 'Team B'
        }
    ],
    
    trainingRecords: [
        {
            id: 'TR-001',
            employeeId: 'EMP-2024-001',
            employeeName: 'Maria Santos',
            trainingTitle: 'Soldering Process Training',
            trainingCategory: 'Hands-on',
            trainingDate: '2025-11-15',
            trainer: 'Engr. Roberto Cruz',
            validityPeriod: '3 months',
            expirationDate: '2026-02-15',
            processClassification: 'Difficult',
            factory: '1ST',
            line: 'MX68',
            team: 'Team A'
        },
        {
            id: 'TR-002',
            employeeId: 'EMP-2024-002',
            employeeName: 'John Reyes',
            trainingTitle: 'Quality Control Assessment',
            trainingCategory: 'Assessment',
            trainingDate: '2025-11-20',
            trainer: 'Engr. Maria Lopez',
            validityPeriod: '3 months',
            expirationDate: '2026-02-20',
            processClassification: 'Easy',
            factory: '1ST',
            line: 'MX68',
            team: 'Team B'
        },
        {
            id: 'TR-003',
            employeeId: 'EMP-2024-003',
            employeeName: 'Ana Cruz',
            trainingTitle: 'Safety Training',
            trainingCategory: 'Hands-on',
            trainingDate: '2025-08-28',
            trainer: 'Safety Officer Juan Santos',
            validityPeriod: '6 months',
            expirationDate: '2026-02-28',
            processClassification: 'Non sensing',
            factory: '2ND',
            line: 'MX48',
            team: 'Team A'
        },
        {
            id: 'TR-004',
            employeeId: 'EMP-2023-045',
            employeeName: 'Pedro Garcia',
            trainingTitle: 'Equipment Operation',
            trainingCategory: 'Hands-on',
            trainingDate: '2025-09-05',
            trainer: 'Engr. Carlos Diaz',
            validityPeriod: '6 months',
            expirationDate: '2026-03-05',
            processClassification: 'Non sensing',
            factory: '1ST',
            line: 'MX79AC',
            team: 'Team B'
        },
        {
            id: 'TR-005',
            employeeId: 'EMP-2024-015',
            employeeName: 'Carlos Mendoza',
            trainingTitle: 'SMT Process Training',
            trainingCategory: 'Hands-on',
            trainingDate: '2026-01-10',
            trainer: 'Engr. Roberto Cruz',
            validityPeriod: '6 months',
            expirationDate: '2026-07-10',
            processClassification: 'Difficult',
            factory: '1ST',
            line: 'MX68',
            team: 'Team A'
        },
        {
            id: 'TR-006',
            employeeId: 'EMP-2023-089',
            employeeName: 'Lisa Fernandez',
            trainingTitle: 'Critical Process Sensing',
            trainingCategory: 'Assessment',
            trainingDate: '2025-01-15',
            trainer: 'Engr. Elena Torres',
            validityPeriod: '1 year',
            expirationDate: '2026-01-15',
            processClassification: 'Sensing',
            factory: '2ND',
            line: 'MX48',
            team: 'Team B'
        },
        {
            id: 'TR-007',
            employeeId: 'EMP-2024-022',
            employeeName: 'Roberto Lim',
            trainingTitle: 'Soldering Process Training',
            trainingCategory: 'Hands-on',
            trainingDate: '2025-12-10',
            trainer: 'Engr. Roberto Cruz',
            validityPeriod: '3 months',
            expirationDate: '2026-01-05',
            processClassification: 'Difficult',
            factory: '1ST',
            line: 'MX68',
            team: 'Team A'
        },
        {
            id: 'TR-008',
            employeeId: 'EMP-2024-033',
            employeeName: 'Elena Torres',
            trainingTitle: 'Safety Training',
            trainingCategory: 'Hands-on',
            trainingDate: '2025-09-01',
            trainer: 'Safety Officer Juan Santos',
            validityPeriod: '6 months',
            expirationDate: '2026-02-10',
            processClassification: 'Non sensing',
            factory: '2ND',
            line: 'MX48',
            team: 'Team B'
        },
        {
            id: 'TR-009',
            employeeId: 'EMP-2023-102',
            employeeName: 'Miguel Ramos',
            trainingTitle: 'Equipment Operation',
            trainingCategory: 'Hands-on',
            trainingDate: '2025-08-20',
            trainer: 'Engr. Carlos Diaz',
            validityPeriod: '6 months',
            expirationDate: '2026-01-28',
            processClassification: 'Non sensing',
            factory: '1ST',
            line: 'MX79AC',
            team: 'Team A'
        },
        {
            id: 'TR-010',
            employeeId: 'EMP-2024-041',
            employeeName: 'Sofia Reyes',
            trainingTitle: 'Quality Control Assessment',
            trainingCategory: 'Assessment',
            trainingDate: '2025-11-25',
            trainer: 'Engr. Maria Lopez',
            validityPeriod: '3 months',
            expirationDate: '2026-02-15',
            processClassification: 'Easy',
            factory: '2ND',
            line: 'MX48',
            team: 'Team A'
        },
        {
            id: 'TR-011',
            employeeId: 'EMP-2024-055',
            employeeName: 'James Ong',
            trainingTitle: 'SMT Process Training',
            trainingCategory: 'Hands-on',
            trainingDate: '2025-10-15',
            trainer: 'Engr. Roberto Cruz',
            validityPeriod: '6 months',
            expirationDate: '2026-02-12',
            processClassification: 'Critical / Special',
            factory: '1ST',
            line: 'MX68',
            team: 'Team B'
        },
        {
            id: 'TR-012',
            employeeId: 'EMP-2023-078',
            employeeName: 'Carmen Villanueva',
            trainingTitle: 'Critical Process Sensing',
            trainingCategory: 'Assessment',
            trainingDate: '2025-02-01',
            trainer: 'Engr. Elena Torres',
            validityPeriod: '1 year',
            expirationDate: '2026-01-20',
            processClassification: 'Sensing',
            factory: '2ND',
            line: 'MX48',
            team: 'Team B'
        },
        {
            id: 'TR-013',
            employeeId: 'EMP-2024-067',
            employeeName: 'Daniel Tan',
            trainingTitle: 'Soldering Process Training',
            trainingCategory: 'Hands-on',
            trainingDate: '2026-01-05',
            trainer: 'Engr. Roberto Cruz',
            validityPeriod: '3 months',
            expirationDate: '2026-04-05',
            processClassification: 'Difficult',
            factory: '1ST',
            line: 'MX79AC',
            team: 'Team A'
        },
        {
            id: 'TR-014',
            employeeId: 'EMP-2024-071',
            employeeName: 'Patricia Gomez',
            trainingTitle: 'Safety Training',
            trainingCategory: 'Hands-on',
            trainingDate: '2025-12-20',
            trainer: 'Safety Officer Juan Santos',
            validityPeriod: '6 months',
            expirationDate: '2026-02-18',
            processClassification: 'Non sensing',
            factory: '1ST',
            line: 'MX68',
            team: 'Team B'
        },
        {
            id: 'TR-015',
            employeeId: 'EMP-2024-001',
            employeeName: 'Maria Santos',
            trainingTitle: 'Quality Control Assessment',
            trainingCategory: 'Assessment',
            trainingDate: '2025-06-01',
            trainer: 'Engr. Maria Lopez',
            validityPeriod: '6 months',
            expirationDate: '2025-12-01',
            processClassification: 'Easy',
            factory: '1ST',
            line: 'MX68',
            team: 'Team A'
        },
        {
            id: 'TR-016',
            employeeId: 'EMP-2024-002',
            employeeName: 'John Reyes',
            trainingTitle: 'Safety Training',
            trainingCategory: 'Hands-on',
            trainingDate: '2025-07-15',
            trainer: 'Safety Officer Juan Santos',
            validityPeriod: '6 months',
            expirationDate: '2026-01-10',
            processClassification: 'Non sensing',
            factory: '1ST',
            line: 'MX68',
            team: 'Team B'
        },
        {
            id: 'TR-017',
            employeeId: 'EMP-2023-045',
            employeeName: 'Pedro Garcia',
            trainingTitle: 'Critical Process Sensing',
            trainingCategory: 'Assessment',
            trainingDate: '2025-03-20',
            trainer: 'Engr. Elena Torres',
            validityPeriod: '1 year',
            expirationDate: '2026-02-08',
            processClassification: 'Sensing',
            factory: '1ST',
            line: 'MX79AC',
            team: 'Team B'
        },
        {
            id: 'TR-018',
            employeeId: 'EMP-2024-003',
            employeeName: 'Ana Cruz',
            trainingTitle: 'Equipment Operation',
            trainingCategory: 'Hands-on',
            trainingDate: '2025-05-10',
            trainer: 'Engr. Carlos Diaz',
            validityPeriod: '6 months',
            expirationDate: '2025-11-10',
            processClassification: 'Non sensing',
            factory: '2ND',
            line: 'MX48',
            team: 'Team A'
        },
        {
            id: 'TR-019',
            employeeId: 'EMP-2024-022',
            employeeName: 'Roberto Lim',
            trainingTitle: 'Equipment Operation',
            trainingCategory: 'Hands-on',
            trainingDate: '2025-11-01',
            trainer: 'Engr. Carlos Diaz',
            validityPeriod: '3 months',
            expirationDate: '2026-02-05',
            processClassification: 'Non sensing',
            factory: '1ST',
            line: 'MX68',
            team: 'Team A'
        },
        {
            id: 'TR-020',
            employeeId: 'EMP-2024-033',
            employeeName: 'Elena Torres',
            trainingTitle: 'SMT Process Training',
            trainingCategory: 'Hands-on',
            trainingDate: '2026-01-20',
            trainer: 'Engr. Roberto Cruz',
            validityPeriod: '6 months',
            expirationDate: '2026-07-20',
            processClassification: 'Difficult',
            factory: '2ND',
            line: 'MX48',
            team: 'Team B'
        }
    ],
    
    users: [
        {
            username: 'admin',
            password: 'admin123',
            role: 'admin',
            fullName: 'Juan Dela Cruz',
            email: 'juan.delacruz@jae.com'
        },
        {
            username: 'encoder',
            password: 'encoder123',
            role: 'encoder',
            fullName: 'Maria Santos',
            email: 'maria.santos@jae.com'
        },
        {
            username: 'viewer',
            password: 'viewer123',
            role: 'viewer',
            fullName: 'External Auditor',
            email: 'auditor@external.com'
        }
    ]
};
if (typeof window !== 'undefined') window.staticData = staticData;

// Helper functions
function getEmployeeById(id) {
    return staticData.employees.find(emp => emp.id === id);
}

function getTrainingRecordsByEmployee(employeeId) {
    return staticData.trainingRecords.filter(record => record.employeeId === employeeId);
}

function getTrainingRecordById(id) {
    return staticData.trainingRecords.find(record => record.id === id);
}
