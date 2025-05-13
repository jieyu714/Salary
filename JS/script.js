let last_month = null;
let last_year = null;
const yearly_data = new Map();
const monthly_data = new Map();
let years = ["2025"];
let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function handleButtonClick(event) {
    const target = event.target;
  
    if (target.classList.contains("year") || target.classList.contains("month")) {
        if (target.classList.contains("year")) {
            if (last_year !== null) {
                last_year.classList.remove("clicked");
            }
            target.classList.add("clicked");
            last_year = target;
        } else {
            if (last_month !== null) {
                last_month.classList.remove("clicked");
            }
            target.classList.add("clicked");
            last_month = target;
        }
    }

    if (last_year != null && last_month != null) {
        show_data();
    }
}

async function import_data() {
    for (let year_idx = 0; year_idx < years.length; year_idx++) {
        if (!yearly_data.has(years[year_idx])) {
            yearly_data.set(`${years[year_idx]}`, new Map());
        }

        let yearly_flag = true;
        let yearly_total_working_hours = 0.0;
        let yearly_total_basic_salary = 0.0;
        let yearly_total_overtime_pay = 0.0;
        let yearly_total_total_salary = 0.0;

        for (let month_idx = 0; month_idx < 12; month_idx++) {
            const filename = `data/${years[year_idx]}_${months[month_idx]}_Salary.csv`;

            let monthly_flag = true;
            let monthly_total_working_hours = 0.0;
            let monthly_total_basic_salary = 0.0;
            let monthly_total_overtime_pay = 0.0;
            let monthly_total_total_salary = 0.0;

            try {
                const response = await fetch(filename);
                if (!response.ok) {
                    throw new Error(`檔案讀取失敗: ${response.status} - ${response.statusText}`);
                }

                if (!monthly_data.has(`${years[year_idx]}_${months[month_idx]}`)) {
                    monthly_data.set(`${years[year_idx]}_${months[month_idx]}`, new Map());
                }

                const data = await response.text();
                let lines = data.split('\n');
                lines.shift();

                for (let d = 0; d < lines.length; d++) {
                    const line = lines[d].trim();
                    if (line === '') continue;

                    const parts = line.split(',');
                    
                    const time = parts[0].split(' ')[1].trim();
                    const class_value = parts[1].trim();
                    const hourly_wage = parseFloat(parts[2]);
                    const check = parts.length >= 9 ? true : false;
                    const remark = parts[7].trim();
                    const working_hours = classModification(parseFloat(parts[3]), parseFloat(parts[4]), parseFloat(parts[5]), parseFloat(parts[6]));
                    const basic_salary = Math.min(working_hours, 8) * hourly_wage;
                    const overtime_pay = Math.max(working_hours - 8, 0) * hourly_wage + Math.max(working_hours - 8, 0) * (hourly_wage / 3) + Math.max(working_hours - 10, 0) * (hourly_wage / 3);
                    const total_salary = basic_salary + overtime_pay;
                    
                    monthly_total_working_hours += working_hours;
                    monthly_total_basic_salary += basic_salary;
                    monthly_total_overtime_pay += overtime_pay;
                    monthly_total_total_salary += total_salary;
                    monthly_flag &= check;

                    monthly_data.get(`${years[year_idx]}_${months[month_idx]}`).set(time, [class_value, working_hours.toFixed(1), hourly_wage.toFixed(1), basic_salary.toFixed(1), overtime_pay.toFixed(1), total_salary.toFixed(1), remark, check]);
                }

                monthly_data.get(`${years[year_idx]}_${months[month_idx]}`).set("total", ['', monthly_total_working_hours.toFixed(1), '', monthly_total_basic_salary.toFixed(1), monthly_total_overtime_pay.toFixed(1), monthly_total_total_salary.toFixed(1), '', monthly_flag]);
                yearly_data.get(years[year_idx]).set(months[month_idx], [monthly_total_working_hours.toFixed(1), monthly_total_basic_salary.toFixed(1), monthly_total_overtime_pay.toFixed(1), monthly_total_total_salary.toFixed(1), monthly_flag]);
            } catch (error) {
                console.warn(`無法讀取檔案: ${filename}. 錯誤訊息: ${error.message}`);
            }

            yearly_total_working_hours += monthly_total_working_hours;
            yearly_total_basic_salary += monthly_total_basic_salary;
            yearly_total_overtime_pay += monthly_total_overtime_pay;
            yearly_total_total_salary += monthly_total_total_salary;
            yearly_flag &= monthly_flag;
        }
        yearly_data.get(years[year_idx]).set("total", [yearly_total_working_hours.toFixed(1), yearly_total_basic_salary.toFixed(1), yearly_total_overtime_pay.toFixed(1), yearly_total_total_salary.toFixed(1), yearly_flag]);
    }
}

function classModification(t1, t2, t3, t4) {
    if (t1 != -1) t1 = Math.floor(t1 / 100) + 0.5 * !!(t1 % 100);
    if (t2 != -1) t2 = Math.floor(t2 / 100) + 0.5 * !!(t2 % 100);
    if (t3 != -1) t3 = Math.floor(t3 / 100) + 0.5 * !!(t3 % 100);
    if (t4 != -1) t4 = Math.floor(t4 / 100) + 0.5 * !!(t4 % 100);

    if (t1 == -1 && t4 == -1) return 0;
    else if (t2 == -1 && t3 == -1) return t4 - t1;
    else return (t4 - t3) + (t2 - t1);
}

function show_data() {
    const data_table = document.getElementById("show");
    const table_head = data_table.querySelector("thead");
    const table_body = data_table.querySelector("tbody");
    let htmlContent = '';

    if (last_month.textContent == "Annual") {
        const show_key = last_year.textContent;
        if (!yearly_data.has(show_key)) {
            table_head.innerHTML = '';
            table_body.innerHTML = "<div>找不到該年份的資料</div>";
            return;
        }

        table_head.innerHTML = "<tr><th>time</th><th>Working hours</th><th>Basic salary</th><th>Overtime pay</th><th>Total salary</th></tr>";
        for (const [key, value] of yearly_data.get(show_key)) {
            let tmp = "<tr>" + `
                        <td>${last_year.textContent} ${key}</td>
                        <td>${value[0]}</td>
                        <td>${value[1]}</td>
                        <td>${value[2]}</td>
                        <td>${value[3]}</td>
                    ` + "</tr>\n";
            if (value[4]) {
                tmp.replace("<td>", "<td><b>");
                tmp.replace("</td>", "</b></td>");
            }
            htmlContent += tmp;
        }
    } else {
        const show_key = `${last_year.textContent}_${last_month.textContent}`;
        if (!monthly_data.has(show_key)) {
            table_head.innerHTML = '';
            table_body.innerHTML = "<div>找不到該月份的資料</div>";
            return;
        }
        
        table_head.innerHTML = "<tr><th>time</th><th>Class</th><th>Working hours</th><th>Hourly wage</th><th>Basic salary</th><th>Overtime pay</th><th>Total salary</th><th>Remark</th></tr>";
        for (const [key, value] of monthly_data.get(show_key)) {
            let tmp = "<tr>" + `
                        <td>${last_month.textContent} ${key}</td>
                        <td>${value[0]}</td>
                        <td>${value[1]}</td>
                        <td>${value[2]}</td>
                        <td>${value[3]}</td>
                        <td>${value[4]}</td>
                        <td>${value[5]}</td>
                        <td>${value[6]}</td>
                    ` + "</tr>\n";
            if (value[7]) {
                tmp.replace("<td>", "<td><b>");
                tmp.replace("</td>", "</b></td>");
            }
            htmlContent += tmp;
        }
    }

    table_body.innerHTML = htmlContent;
}

import_data();
document.getElementById("selection_year").addEventListener("click", handleButtonClick);
document.getElementById("selection_month").addEventListener("click", handleButtonClick);