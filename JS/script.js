import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const supabaseUrl = 'https://mdspsmxwitbczvfwzpiu.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kc3BzbXh3aXRiY3p2Znd6cGl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMjMwNDUsImV4cCI6MjA2Mjg5OTA0NX0.2sb9ReFc7T2sqjcTGrzPK_til3XcZVNBgcb4UzGegM4'
const supabase = createClient(supabaseUrl, supabaseKey)

let lastMonth = null;
let lastYear = null;
const yearlyData = new Map();
const monthlyData = new Map();
const dailyTimePoint = new Map();
let years = ["2025"];
let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function showLoading() {
    Swal.fire({
        title: '載入中...',
        html: '請稍候...',
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
            Swal.showLoading()
        }
    });

    const clickableElements = document.querySelectorAll('button, .clickable-hours');
    clickableElements.forEach(element => {
        element.disabled = true;
    });
}

function hideLoading() {
    Swal.close();

    const clickableElements = document.querySelectorAll('button, .clickable-hours');
    clickableElements.forEach(element => {
        element.disabled = false;
    });
}

function handleButtonClick(event) {
    const target = event.target;

    if (target.classList.contains("year") || target.classList.contains("month")) {
        if (target.classList.contains("year")) {
            if (lastYear !== null) {
                lastYear.classList.remove("clicked");
            }
            target.classList.add("clicked");
            lastYear = target;
        } else {
            if (lastMonth !== null) {
                lastMonth.classList.remove("clicked");
            }
            target.classList.add("clicked");
            lastMonth = target;
        }
    }

    if (lastYear != null && lastMonth != null) {
        showData();
    }
}

async function importData() {
    showLoading();

    try {
        for (let yearIdx = 0; yearIdx < years.length; yearIdx++) {

            if (!yearlyData.has(years[yearIdx])) {
                yearlyData.set(`${years[yearIdx]}`, new Map());
            }

            let yearlyFlag = true;
            let yearlyTotalWorkingHours = 0.0;
            let yearlyTotalBasicSalary = 0.0;
            let yearlyTotalOvertimePay = 0.0;
            let yearlyTotalTotalSalary = 0.0;

            for (let monthIdx = 0; monthIdx < 12; monthIdx++) {

                let monthlyFlag = true;
                let monthlyTotalWorkingHours = 0.0;
                let monthlyTotalBasicSalary = 0.0;
                let monthlyTotalOvertimePay = 0.0;
                let monthlyTotalTotalSalary = 0.0;

                const { data, error } = await supabase
                    .from(`salary${years[yearIdx]}${months[monthIdx].toLowerCase()}`)
                    .select('*')
                    .order('dateNumber', { ascending: true });

                if (error) {
                    console.error('資料獲取錯誤:', error);
                    continue;
                }

                if (!monthlyData.has(`${years[yearIdx]}_${months[monthIdx]}`)) {
                    monthlyData.set(`${years[yearIdx]}_${months[monthIdx]}`, new Map());
                }

                if (data) {
                    for (let d = 0; d < data.length; d++) {

                        const line = data[d];

                        const time = line.dateNumber;
                        const classValue = line.class;
                        const hourlyWage = line.hourlyWage;
                        const workingHours = line.workingHours;
                        const basicSalary = line.basicSalary;
                        const overtimePay = line.overtimePay;
                        const totalSalary = line.totalSalary;
                        const remark = line.remark;
                        const verify = line.verify;
                        const timePointOne = line.timePointOne;
                        const timePointTwo = line.timePointTwo;
                        const timePointThree = line.timePointThree;
                        const timePointFour = line.timePointFour;

                        monthlyTotalWorkingHours += workingHours;
                        monthlyTotalBasicSalary += basicSalary;
                        monthlyTotalOvertimePay += overtimePay;
                        monthlyTotalTotalSalary += totalSalary;
                        monthlyFlag &= verify;

                        monthlyData.get(`${years[yearIdx]}_${months[monthIdx]}`).set(time, [classValue, workingHours, hourlyWage, basicSalary, overtimePay, totalSalary, remark, verify]);
                        dailyTimePoint.set(`${years[yearIdx]}${months[monthIdx].toLowerCase()}${time}`, [timePointOne, timePointTwo, timePointThree, timePointFour]);
                    }
                }


                monthlyData.get(`${years[yearIdx]}_${months[monthIdx]}`).set("total", ['', monthlyTotalWorkingHours, '', monthlyTotalBasicSalary, monthlyTotalOvertimePay, monthlyTotalTotalSalary, '', monthlyFlag]);
                yearlyData.get(years[yearIdx]).set(months[monthIdx], [monthlyTotalWorkingHours, monthlyTotalBasicSalary, monthlyTotalOvertimePay, monthlyTotalTotalSalary, monthlyFlag]);

                yearlyTotalWorkingHours += monthlyTotalWorkingHours;
                yearlyTotalBasicSalary += monthlyTotalBasicSalary;
                yearlyTotalOvertimePay += monthlyTotalOvertimePay;
                yearlyTotalTotalSalary += monthlyTotalTotalSalary;
                yearlyFlag &= monthlyFlag;
            }
            yearlyData.get(years[yearIdx]).set("total", [yearlyTotalWorkingHours, yearlyTotalBasicSalary, yearlyTotalOvertimePay, yearlyTotalTotalSalary, yearlyFlag]);
        }
    } catch (error) {
        console.error("Error during data import:", error);
    } finally {
        hideLoading();
    }
}

async function showData() {
    const dataTable = document.getElementById("show");
    const tableHead = dataTable.querySelector("thead");
    const tableBody = dataTable.querySelector("tbody");
    let htmlContent = '';

    if (lastMonth.textContent == "Annual") {
        const showKey = lastYear.textContent;
        if (!yearlyData.has(showKey)) {
            tableHead.innerHTML = '';
            tableBody.innerHTML = "<div>找不到該年份的資料</div>";
            return;
        }

        tableHead.innerHTML = "<tr><th>Time</th><th>Working Hours</th><th>Basic Salary</th><th>Overtime Pay</th><th>Total Salary</th></tr>";

        for (const [key, value] of yearlyData.get(showKey)) {
            let isBold = value[4] ? '<b>' : '';
            let boldEnd = value[4] ? '</b>' : '';

            let tmp = `<tr>
                        <td>${isBold}${lastYear.textContent} ${key}${boldEnd}</td>
                        <td>${isBold}${value[0]}${boldEnd}</td>
                        <td>${isBold}${value[1]}${boldEnd}</td>
                        <td>${isBold}${value[2]}${boldEnd}</td>
                        <td>${isBold}${value[3]}${boldEnd}</td>
                    </tr>\n`;

            htmlContent += tmp;
        }
    } else {
        const showKey = `${lastYear.textContent}_${lastMonth.textContent}`;
        if (!monthlyData.has(showKey)) {
            tableHead.innerHTML = '';
            tableBody.innerHTML = "<div>找不到該月份的資料</div>";
            return;
        }

        tableHead.innerHTML = "<tr><th>Time</th><th>Class</th><th>Working Hours</th><th>Hourly Wage</th><th>Basic Salary</th><th>Overtime Pay</th><th>Total Salary</th><th>Remark</th></tr>";

        const sortedKeys = Array.from(monthlyData.get(showKey).keys()).sort((a, b) => {
            return a - b;
        });

        for (const key of sortedKeys) {
            const value = monthlyData.get(showKey).get(key);

            let isBold = value[7] ? '<b>' : '';
            let boldEnd = value[7] ? '</b>' : '';

            let tmp = `<tr>
                        <td>${isBold}${lastMonth.textContent} ${key}${boldEnd}</td>
                        <td>${isBold}${value[0]}${boldEnd}</td>
                        <td class="clickable-hours" data-day="${key}" style="cursor: pointer;">${isBold}${value[1]}${boldEnd}</td>
                        <td>${isBold}${value[2]}${boldEnd}</td>
                        <td>${isBold}${value[3]}${boldEnd}</td>
                        <td>${isBold}${value[4]}${boldEnd}</td>
                        <td>${isBold}${value[5]}${boldEnd}</td>
                        <td>${isBold}${value[6]}${boldEnd}</td>
                    </tr>\n`;

            htmlContent += tmp;
        }
    }

    tableBody.innerHTML = htmlContent;

    const clickableHours = document.querySelectorAll('.clickable-hours');
    clickableHours.forEach(cell => {
        cell.addEventListener('click', handleWorkingHoursClick);
    });
}

async function handleWorkingHoursClick(event) {
    let day;
    const target = event.target;

    if (target.tagName === 'B') {
        day = target.parentNode.dataset.day;
    } else {
        day = target.dataset.day;
    }

    const year = lastYear.textContent;
    const month = lastMonth.textContent;

    const timePoints = dailyTimePoint.get(`${year}${month.toLowerCase()}${day}`);

    displayTimePoints(timePoints);
}

function displayTimePoints(timePoints) {
    if (!timePoints) {
        Swal.fire({
            icon: 'error',
            title: '錯誤',
            text: '未找到今日資料',
        });
        return;
    }

    let popupContent;
    if (timePoints[0] == -1 && timePoints[3] == -1) {
        popupContent = '<p>今日未上班</p>'
    } else if (timePoints[1] == -1 && timePoints[2] == -1) {
        popupContent = `
        <p><b>上:</b> ${timePoints[0] || 'N/A'}</p>
        <p><b>下:</b> ${timePoints[3] || 'N/A'}</p>
    `;
    } else {
        popupContent = `
        <p><b>上:</b> ${timePoints[0] || 'N/A'}</p>
        <p><b>空:</b> ${timePoints[1] || 'N/A'}</p>
        <p><b>出:</b> ${timePoints[2] || 'N/A'}</p>
        <p><b>下:</b> ${timePoints[3] || 'N/A'}</p>
    `;
    }

    Swal.fire({
        title: '上班時間表',
        html: popupContent,
        confirmButtonText: '確認'
    });
}

document.addEventListener('DOMContentLoaded', () => {
    importData();
    document.getElementById("selection_year").addEventListener("click", handleButtonClick);
    document.getElementById("selection_month").addEventListener("click", handleButtonClick);
});
