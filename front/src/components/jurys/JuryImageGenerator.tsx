import { Landscape } from "@mui/icons-material";
// @ts-ignore
import html2pdf from "html2pdf.js";

export interface JuryInfos {
    Firstname: string;
    Lastname: string;
    Picture: string;
    Address: string;
}

export interface GenerateJuryImageProps {
    cardInfos: JuryInfos,
    cardDataUrl: string
}

export const GenerateJuryImage = async (cardInfos: JuryInfos) => {
    if (cardInfos.Picture !== '') {
        const element = document.getElementById('cardPdf');
        if (element) {
            element.style.display = 'block';

         /*   const opt = {
                margin:1,
                unit: 'px',
                orientation: Landscape,
                jsPDF: {format: [125, 125]}
            }

            return await html2pdf().set(opt).from(element).toImg().outputImg('dataurl');*/

            const html2pdfWorker = new html2pdf.Worker();
            const cardDataUrl = await html2pdfWorker
                .set({
                    margin:1,
                    unit: 'px',
                    orientation: Landscape,
                    jsPDF: {format: [125, 125]}
                })
                .from(element)
                .toImg()
                .outputImg('dataurl');

            console.log(cardDataUrl);

            return cardDataUrl;
        }
    }
    return '';
}

export const GenerateJuryGenerator = ({cardInfos, cardDataUrl}: GenerateJuryImageProps) => {
    return (
        <>
            <div>
                <img id="generatedCard" src={cardDataUrl}></img>
            </div>

            <div id="cardPdf" style={{display: 'none'}}>
                <div className="logos">
                    <div className="companyLogo">
                        <img src="/logo_devfest.png" alt="Logo" id="companyLogo" />
                    </div>
                    <div className="pictureBrand">
                        DevFest Nantes
                    </div>
                </div>
                <div className="title">
                    <h3>JURY</h3>
                </div>
                <div className="memberDetails">
                    <div className="memberPicture">
                        <div className="picture">
                            <img src={`data:image/*;${cardInfos.Picture}`} alt="Member" id="memberPicture" />
                        </div>
                    </div>
                    <div className="memberCardDetails">
                        <div id="memberFirstname"><span className="label">Firstname:</span> {cardInfos.Firstname}</div>
                        <div id="memberLastname"><span className="label">Lastname:</span> {cardInfos.Lastname}</div>
                        <div id="memberStartdate"><span className="label">Address:</span> {cardInfos.Address.substring(0,5)}...{cardInfos.Address.substring(38,42)}</div>
                    </div>
                </div>
            </div>
            <style>{`
                #cardPdf {
                    display: block;
                    height: 250px;
                    width: 440px;
                    margin: auto;
                    background-color: white;
                    color: black;
                    border: 1px solid black;
                    border-radius: 25px;
                    text-align: left;
                }
                #cardPdf .logos {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                #cardPdf .companyLogo {
                    margin-top: 20px;
                    margin-left: 25px;
                }
                #cardPdf .pictureBrand {
                    text-align: right;
                    margin-top: 30px;
                    font-weight: 800;
                    font-size: 1.5rem;
                    margin-right: 20px;
                }
                #cardPdf .companyLogo > img {
                 width: 60px;
                 height: 60px;
                }
                #cardPdf .title{
                  text-align: center;
                  margin-top: -10px;
                }
                #cardPdf .memberDetails {
                    margin-top: -10px;
                    display: flex;
                    justify-content: center;
                }
                #cardPdf .memberPicture .picture > img {
                    width: 100px;
                    height: 100px;
                }
                #cardPdf span.label {
                    font-weight: bold;
                }
                #cardPdf .memberCardDetails {
                    margin: 15px 0 0 30px;
                }
            `}</style>
        </>
    )
}

export default GenerateJuryGenerator
