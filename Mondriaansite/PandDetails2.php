<?php
$PandID = $_GET["PandID"];
$mysql = mysql_connect("185.56.145.84","retorq1q","cnxdWK4H") or die("Fout: Er is geen verbinding met de MySQL-server tot stand gebracht!");
mysql_select_db("retorq1q_makelaars",$mysql) or die("Fout: Het openen van de database is mislukt!");
$resultaat = mysql_query("SELECT * FROM panden Where PandID = $PandID",$mysql) or die("De query op de database is mislukt!");
mysql_close($mysql) or die("Het verbreken van de verbinding met de MySQL-server is mislukt!");

print("<table><tr><td>PandID</td><td>Pand naam</td><td>VerkoperID</td>
		<td>Verkoop datum</td><td>Inkoopprijs</td><td>Verkoopprijs</td>
		<td>Verkocht?</td><td>RegioPand</td><td>Type</td><td>Plaatje</td>
		<td>Postcode</td><td>Plaats</td><td>Oppervlakte</td><td>Slaapkamers</td>
		<td>Richting tuin</td><td>Bescrhijving</td></tr>");
	list($PandID,$PandNaam,$VerkoperID,$VerkoopDatum,$Inkoopprijs,$Verkoopprijs,$Verkocht,$RegioPand,$Type,$Plaatje,$Postcode,$Plaats,$Oppervlakte,$Slaapkamers,$Richting,$Beschrijving) = mysql_fetch_row($resultaat);
	$Image = "<img src=$Plaatje alt=\"plaatje\" style=\"width:200;height:100;\">";
	  print("<tr><td>$PandID</td><td>$PandNaam</td><td>$VerkoperID</td>
		<td>$VerkoopDatum</td><td>$Inkoopprijs</td><td>$Verkoopprijs</td>
		<td>$Verkocht</td><td>$RegioPand</td><td>$Type</td><td>$Image</td>
		<td>$Postcode</td><td>$Plaats</td><td>$Oppervlakte</td><td>$Slaapkamers</td>
		<td>$Richting</td><td>$Beschrijving</td></tr>");

print("</table>");

?>
<br />

<button onclick="history.go(-1);">Back </button>