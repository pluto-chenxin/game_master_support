const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateReportStatus() {
  try {
    // Update report with ID 12 to have in-progress status
    const updatedReport = await prisma.report.update({
      where: { id: 12 },
      data: { status: 'in-progress' }
    });
    
    console.log('Updated report:', updatedReport);
  } catch (error) {
    console.error('Error updating report:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateReportStatus(); 