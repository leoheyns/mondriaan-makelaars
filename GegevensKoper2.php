<?php
$koperID = NULL;
$PandID = $_POST["PandID"];
$Voornaam = $_POST["Voornaam"];
$Tussenvoegsel = $_POST["Tussenvoegsel"];
$Achternaam = $_POST["Achternaam"];
$MV = $_POST["M/V"];
$Geb_Datum = $_POST["Geb_Datum"];
$Postcode = $_POST["Postcode"];
$Regio = $_POST["Regio"];
$Plaats = $_POST["Plaats"];
$Telefoonnummer = $_POST["Telefoonnummer"];
$EmailKoper = $_POST["EmailKoper"];
{
$mysql = mysql_connect("185.56.145.84","retorq1q","cnxdWK4H") or die("Fout: Er is geen verbinding met de MySQL-server tot stand gebracht!");
mysql_select_db("retorq1q_makelaars",$mysql) or die("Fout: Het openen van de database is mislukt!");
mysql_query("INSERT INTO kopers VALUES ('$koperID','$PandID','$Voornaam','$Tussenvoegsel','$Achternaam','$MV','$Geb_Datum','$Postcode','$Regio','$Plaats','$Telefoonnummer','$EmailKoper')",$mysql) or die("De toevoegquery op de database is mislukt!"); 
mysql_close($mysql) or die("Het verbreken van de verbinding met de MySQL-server is mislukt!");

print("Hallo $PandID $Voornaam $Tussenvoegsel $Achternaam $MV $Geb_Datum $Postcode $Regio $Plaats $Telefoonnummer $EmailKoper");
}
?>