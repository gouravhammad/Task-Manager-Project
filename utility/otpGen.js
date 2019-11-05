function getOTP()
{
    const number = Math.floor((Math.random() * (876567 - 234523) + 234523));
    return number;
}

module.exports = getOTP