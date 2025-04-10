// 页面加载时执行
document.addEventListener('DOMContentLoaded', function() {
    const months = ['February', 'March', 'April', 'May', 'June', 'July'];
    months.forEach(month => {
        initializePage(month);
    });
    initializeEventListeners(); // 初始化事件监听器，只需执行一次
});

// 初始化页面：加载 HTML 和数据
async function initializePage(month) {
    const bigSalaryId = 'big_' + month + '_salary';
    const smallSalaryId = 'small_' + month + '_salary';
    const txtFilePath = 'data/' + month + '_salary.txt';
    const htmlFilePath = 'html/' + month + '_salary.html';

    try {
        // 1. 加载并嵌入 HTML
        await loadAndEmbedHTML(htmlFilePath, bigSalaryId); // 等待 HTML 加载完成

        // 2. 加载数据到表格 (确保 HTML 加载完成)
        loadDataToTable(month, smallSalaryId, txtFilePath);

    } catch (error) {
        console.error(`初始化 ${month} 页面失败：`, error);
    }
}

// 加载外部 HTML 文件并嵌入到指定容器
async function loadAndEmbedHTML(url, containerId) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const html = await response.text();
        document.getElementById(containerId).innerHTML = html;

    } catch (error) {
        console.error(`加载 ${url} 错误：`, error);
        document.getElementById(containerId).innerHTML = `<p>加载 ${url} 失败。</p>`;
    }
}

// 从 TXT 文件加载数据并填充表格
function loadDataToTable(id, tableId, txtFilePath) {
    const dataTable = document.getElementById(tableId);
    const tableBody = dataTable.querySelector('tbody');

    if (!tableBody) {
        console.error(`找不到表格 ${tableId} 的 tbody!`);
        return;
    }

    // 初始化总和变量
    let workingHoursTotal = 0;
    let basicSalaryTotal = 0;
    let overtimePayTotal = 0;
    let totalSalaryTotal = 0;
    let flag = true;

    fetch(txtFilePath)
        .then(response => response.text())
        .then(data => {
            const rows = data.trim().split('\n');
            const headers = rows.shift().split(','); // 移除表头
            tableBody.innerHTML = ''; // 清空表格

            rows.forEach(row => {
                const columns = row.split(',');

                // 数据解析和错误检查
                const workingHours = parseFloat(columns[2]) || 0; // 默认值为0
                const hourlyWage = parseFloat(columns[3]) || 0;   // 默认值为0
                const remark = columns[7] || '';

                // 计算工资
                const basicSalary = Math.min(workingHours, 8) * hourlyWage;
                const overtimePay = Math.max(workingHours - 8, 0) * hourlyWage + Math.max(workingHours - 8, 0) * (hourlyWage / 3) + Math.max(workingHours - 10, 0) * (hourlyWage / 3);
                const totalSalary = basicSalary + overtimePay;

                // 创建表格行和单元格
                const tr = document.createElement('tr');
                if (columns.length == 9) {
                    tr.innerHTML = `
                    <td><b>${columns[0]}</b></td>
                    <td><b>${columns[1]}</b></td>
                    <td><b>${workingHours.toFixed(1)}</b></td>
                    <td><b>${hourlyWage.toFixed(1)}</b></td>
                    <td><b>${basicSalary.toFixed(1)}</b></td>
                    <td><b>${overtimePay.toFixed(1)}</b></td>
                    <td><b>${totalSalary.toFixed(1)}</b></td>
                    <td><b>${remark}</b></td>
                `;
                } else {
                    tr.innerHTML = `
                    <td>${columns[0]}</td>
                    <td>${columns[1]}</td>
                    <td>${workingHours.toFixed(1)}</td>
                    <td>${hourlyWage.toFixed(1)}</td>
                    <td>${basicSalary.toFixed(1)}</td>
                    <td>${overtimePay.toFixed(1)}</td>
                    <td>${totalSalary.toFixed(1)}</td>
                    <td>${remark}</td>
                `;
                    flag = false;
                }
                
                tableBody.appendChild(tr);

                // 更新总计
                workingHoursTotal += workingHours;
                basicSalaryTotal += basicSalary;
                overtimePayTotal += overtimePay;
                totalSalaryTotal += totalSalary;
            });

            // 创建并添加总计行
            const totalRow = document.createElement('tr');
            if (flag) {
                totalRow.innerHTML = `
                    <td><b>${id} Total</b></td>
                    <td></td>
                    <td><b>${workingHoursTotal.toFixed(1)}</b></td>
                    <td></td>
                    <td><b>${basicSalaryTotal.toFixed(1)}</b></td>
                    <td><b>${overtimePayTotal.toFixed(1)}</b></td>
                    <td><b>${totalSalaryTotal.toFixed(1)}</b></td>
                    <td></td>
                `;
            } else {
                totalRow.innerHTML = `
                    <td>${id} Total</td>
                    <td></td>
                    <td>${workingHoursTotal.toFixed(1)}</td>
                    <td></td>
                    <td>${basicSalaryTotal.toFixed(1)}</td>
                    <td>${overtimePayTotal.toFixed(1)}</td>
                    <td>${totalSalaryTotal.toFixed(1)}</td>
                    <td></td>
                `;
            }
            tableBody.appendChild(totalRow);
        })
        .catch(error => console.error('加载 TXT 文件错误：', error));
}

// 初始化事件监听器（只执行一次）
function initializeEventListeners() {
    document.body.addEventListener('click', function(event) {
        if (event.target.classList.contains('label') || event.target.closest('.label')) {
            const label = event.target.classList.contains('label') ? event.target : event.target.closest('.label');
            const targetId = label.dataset.target;
            const table = document.getElementById(targetId);
            const icon = label.querySelector('.label-icon');

            if (table) {
                table.classList.toggle('show-table');
                icon.src = table.classList.contains('show-table') ? 'svg/down_triangle.svg' : 'svg/right_triangle.svg';
            }
        }
    });
}
